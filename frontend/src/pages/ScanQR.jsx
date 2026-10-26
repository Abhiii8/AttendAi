import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import attendanceService from '../services/attendance.service';

export default function ScanQR() {
  const location = useLocation();
  const navigate = useNavigate();

  // Global State
  const [step, setStep] = useState('scan'); // scan, fetching-session, verify, processing, success, error
  const [sessionToken, setSessionToken] = useState('');
  
  // Verify State
  const [attendanceCode, setAttendanceCode] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const webcamRef = useRef(null);

  // Auto-fetch if arrived via Direct Mark
  useEffect(() => {
    const classId = location.state?.classId;
    if (classId && step === 'scan') {
      setStep('fetching-session');
      
      const fetchSession = async () => {
        try {
          const data = await attendanceService.getActiveSession(classId);
          setSessionToken(data.sessionToken);
          setStep('verify');
        } catch (err) {
          setErrorMsg(err.message || 'Waiting for teacher to start session...');
          setTimeout(() => {
             if (window.location.pathname.includes('/scan') && !sessionToken) {
                fetchSession();
             }
          }, 5000);
        }
      };

      fetchSession();
    }
  }, [location.state, step, sessionToken]);

  // 1. Initialize Custom Scanner
  useEffect(() => {
    if (step === 'scan' && !location.state?.classId) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // Removed qrbox to allow full-frame scanning, which is much more reliable on mobile!
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore parsing errors silently
        }
      ).catch((err) => {
        console.error("Camera start error:", err);
      });

      return () => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
        }
      };
    }
  }, [step, location.state]);

  // Load AI Models if we switch to Verify step
  useEffect(() => {
    if (step === 'verify' && !faceapi.nets.ssdMobilenetv1.isLoaded) {
      setLoadingModels(true);
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]).then(() => {
        setLoadingModels(false);
      }).catch(err => {
        console.error("Failed to load models", err);
        setErrorMsg("Failed to load AI Models for verification.");
      });
    }
  }, [step]);

  const onScanSuccess = (result) => {
    let decodedText = '';
    if (Array.isArray(result) && result.length > 0) {
       decodedText = result[0].rawValue;
    } else if (result?.text) {
       decodedText = result.text;
    } else if (typeof result === 'string') {
       decodedText = result;
    }
    
    if (decodedText) {
      setSessionToken(decodedText);
      setStep('verify');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Use Html5Qrcode just for parsing static files
      const html5QrCode = new Html5Qrcode("hidden-file-scanner");
      const decodedText = await html5QrCode.scanFile(file, true);
      
      setSessionToken(decodedText);
      setStep('verify');
    } catch (err) {
      alert("Could not read QR code from the selected image. Make sure the QR is clear.");
    }
  };

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }
    });
  };

  const handleVerify = useCallback(async () => {
    if (!attendanceCode) {
      setErrorMsg("Please enter the secret code from the board.");
      return;
    }
    if (!webcamRef.current) return;

    setStep('processing');
    setErrorMsg('');

    try {
      const position = await getCoordinates().catch(err => {
        throw new Error("Location access required for Geofencing verification. " + err.message);
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Failed to access camera.");
      
      const img = new Image();
      img.src = imageSrc;
      await new Promise(resolve => img.onload = resolve);
      
      const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        throw new Error("No face detected! Look directly at the camera in a well-lit area.");
      }
      const faceDescriptor = Array.from(detection.descriptor);

      const response = await attendanceService.markAttendance({
        sessionToken,
        attendanceCode,
        lat,
        lng,
        faceDescriptor
      });

      setSuccessMsg(response.message || "Attendance securely marked!");
      setStep('success');

    } catch (err) {
      setErrorMsg(err.message || "Verification failed.");
      setStep('error');
    }
  }, [attendanceCode, sessionToken]);

  const retryScan = () => {
    setStep('scan');
    setErrorMsg('');
    setAttendanceCode('');
    setSessionToken('');
  };

  const retryVerify = () => {
    setStep('verify');
    setErrorMsg('');
  };

  return (
    <div className="max-w-[800px] mx-auto animate-fade-in flex flex-col min-h-[80vh]">
      <div id="hidden-file-scanner" style={{display: 'none'}}></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Access Portal</h1>
        <p className="text-text-muted text-[15px] mt-2">AI-Verified Secure Attendance Entry</p>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="glass-panel p-8 md:p-12 rounded-[40px] w-full max-w-xl relative z-10 border border-border/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center">
          
          {/* STEP 1: SCAN QR */}
          {step === 'scan' && (
            <div className="w-full animate-fade-in">
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-[20px] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <p className="text-sm font-medium">Scan the QR code projected on the screen to connect.</p>
              </div>
              
              <div className="rounded-[32px] overflow-hidden border-4 border-[#12131a] shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-black relative mb-4 h-[350px] flex items-center justify-center [&>div]:w-full [&>div]:h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:scale-105">
                 <div id="qr-reader" className="w-full h-full"></div>
                 <div className="absolute inset-0 pointer-events-none border-4 border-primary/30 rounded-[28px] mix-blend-overlay"></div>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-3">
                <p className="text-text-muted text-xs uppercase tracking-widest font-bold">OR</p>
                <input type="file" id="qr-upload" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <button 
                  onClick={() => document.getElementById('qr-upload').click()} 
                  className="w-full py-3 bg-[#12131a] border border-border/10 text-white rounded-xl font-bold text-[14px] hover:bg-[#1a1c25] hover:border-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Upload QR Image (Testing)
                </button>
              </div>
            </div>
          )}

          {/* STEP 1.5: FETCHING SESSION */}
          {step === 'fetching-session' && (
            <div className="py-16 text-center w-full">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-blue-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                <div className="absolute inset-4 border-b-4 border-white rounded-full animate-[spin_3s_linear_infinite]"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">Connecting...</h3>
              <p className="text-text-muted mb-4">Waiting for instructor to initialize session.</p>
              <div className="bg-[#12131a] border border-border/10 py-2 px-4 rounded-full inline-flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                 <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Auto-Polling Active</span>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY */}
          {(step === 'verify' || step === 'processing') && (
            <div className="w-full space-y-8">
              {loadingModels ? (
                <div className="py-16 text-center w-full flex flex-col items-center justify-center">
                  <svg className="animate-spin h-12 w-12 text-primary mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="text-primary font-bold tracking-widest uppercase text-sm mb-2">Neural Link Initiated</p>
                  <p className="text-text-muted text-xs">Loading biometric verification models...</p>
                </div>
              ) : (
                <>
                  <div className="bg-[#12131a] p-6 rounded-[24px] border border-border/10">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-4 text-primary ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                      Authentication Code
                    </label>
                    <input 
                      type="text" 
                      value={attendanceCode} 
                      onChange={(e) => setAttendanceCode(e.target.value)}
                      placeholder="XXXX"
                      className="w-full bg-[#1a1c25] border border-border/10 rounded-full px-4 py-4 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-mono text-3xl tracking-[0.5em] text-center uppercase text-white placeholder:text-text-muted/30"
                      maxLength="6"
                    />
                  </div>

                  <div className="bg-[#12131a] p-2 rounded-[32px] border border-border/10 relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                       <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Biometrics</span>
                    </div>
                    <div className="relative rounded-[24px] overflow-hidden bg-black aspect-square border border-gray-100/5 group">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      
                      {/* Scanning visual effect */}
                      <div className="absolute inset-0 border-2 border-primary/30 rounded-[24px] pointer-events-none"></div>
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(0,208,156,1)] animate-[scan_3s_linear_infinite] pointer-events-none"></div>

                      {step === 'processing' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-10">
                          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          <p className="font-bold text-xs uppercase tracking-widest text-primary">Cross-Referencing GPS & Face ID</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={step === 'processing' || !attendanceCode}
                    className="w-full py-5 bg-primary text-[#0f172a] rounded-full font-bold text-[16px] hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,208,156,0.8)] transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Authorize Entry
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="py-12 text-center w-full flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/30 relative">
                 <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                 <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3 tracking-wide">Access Granted</h3>
              <p className="text-text-muted mb-10 text-lg leading-relaxed">{successMsg}</p>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-4 bg-[#12131a] border border-border/10 text-white rounded-full font-bold text-[15px] hover:bg-[#1a1c25] transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {/* STEP 4: ERROR */}
          {step === 'error' && (
            <div className="py-12 text-center w-full flex flex-col items-center">
              <div className="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mb-8 border border-red-500/30">
                 <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 tracking-wide">Verification Failed</h3>
              <p className="text-red-400 mb-10 bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-sm font-medium">{errorMsg}</p>
              
              <div className="flex flex-col gap-4 w-full">
                <button 
                  onClick={retryVerify}
                  className="w-full py-4 bg-primary text-[#0f172a] rounded-full font-bold text-[15px] hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,208,156,0.8)] transition-all duration-300"
                >
                  Retry Scan
                </button>
                <button 
                  onClick={retryScan}
                  className="w-full py-4 bg-[#12131a] border border-border/10 text-white rounded-full font-bold text-[15px] hover:bg-[#1a1c25] transition-colors"
                >
                  Restart Process
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
