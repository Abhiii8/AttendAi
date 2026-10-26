# AttendAI UML Diagrams

This document outlines the core architecture and flows of the AttendAI system.

---

## 1. Entity-Relationship (ER) Diagram
This diagram maps the relationships between the core data structures in the database.

```mermaid
erDiagram
    DEPARTMENT ||--o{ USER : contains
    DEPARTMENT ||--o{ SUBJECT : teaches
    USER ||--o{ CLASS : "teaches (Faculty)"
    USER ||--o{ CLASS : "enrolled in (Student)"
    SUBJECT ||--o{ CLASS : includes
    CLASS ||--o{ ATTENDANCE : "has sessions"
    USER ||--o{ ATTENDANCE : "marked in records"

    DEPARTMENT {
        ObjectId _id PK
        String name
        String code
    }

    USER {
        ObjectId _id PK
        String name
        String email
        String role
        ObjectId department FK
        Array faceEmbeddings
    }

    SUBJECT {
        ObjectId _id PK
        String name
        String code
        ObjectId department FK
    }

    CLASS {
        ObjectId _id PK
        String name
        ObjectId subject FK
        ObjectId faculty FK
        Array students FK
        Array schedule
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId class FK
        ObjectId faculty FK
        String sessionToken
        String attendanceCode
        Object location
        Array records
    }
```

---

## 2. Direct Marking Sequence Diagram
This diagram illustrates the complex flow of the AI-powered attendance marking process.

```mermaid
sequenceDiagram
    actor Faculty
    actor Student
    participant Frontend
    participant Server (Express)
    participant Database (MongoDB)

    %% Session Creation
    Faculty->>Frontend: Clicks "Start Session" on Timetable
    Frontend->>Frontend: Gets Faculty GPS Coordinates
    Frontend->>Server: POST /api/attendance/start (classId, location)
    Server->>Database: Create Attendance Session
    Database-->>Server: Returns sessionToken & code
    Server-->>Frontend: Success
    Frontend-->>Faculty: Displays 4-digit code on board

    %% Student Marking
    Student->>Frontend: Clicks "Direct Mark" on Dashboard
    Frontend->>Server: GET /api/attendance/active-session
    Server-->>Frontend: Returns sessionToken
    
    Student->>Frontend: Enters 4-digit code from board
    Frontend->>Frontend: Captures Selfie via Webcam
    Frontend->>Frontend: Extracts Face Embeddings (face-api.js)
    Frontend->>Frontend: Gets Student GPS Coordinates
    
    Frontend->>Server: POST /api/attendance/mark (embeddings, location, code, token)
    
    %% Server Validation
    Server->>Database: Validate sessionToken & Code
    Server->>Server: Calculate Geofencing (Distance < 100m)
    Server->>Database: Get Student enrolled Face Embeddings
    Server->>Server: Calculate Euclidean Distance (Face Match < 0.6)
    
    %% Result
    alt If all validations pass
        Server->>Database: Update Attendance Record status to "Present"
        Server-->>Frontend: Success Response
        Frontend-->>Student: Displays Green Success Checkmark
    else If validation fails
        Server-->>Frontend: Error (e.g., "Not in classroom" or "Face mismatch")
        Frontend-->>Student: Displays Error message
    end
```

---

## 3. High-Level Architecture Diagram
This diagram provides a birds-eye view of how the system components interact.

```mermaid
flowchart TD
    %% User Interfaces
    subgraph Client [Frontend (React + Vite)]
        A1[Faculty Dashboard]
        A2[Student Dashboard]
        A3[Admin Panel]
        
        B1[Face-API.js AI Module]
        B2[Browser Geolocation API]
    end

    %% Communication Protocol
    Client -- "REST API (JSON) + JWT" --> Server

    %% Backend Server
    subgraph Server [Backend (Node.js + Express)]
        C1[Auth Middleware]
        C2[Attendance Controller]
        C3[Admin/Faculty Controllers]
        
        C1 --> C2
        C1 --> C3
    end

    %% Database Storage
    Server -- "Mongoose ODM" --> DB

    subgraph DB [Database (MongoDB)]
        D1[(Users Collection)]
        D2[(Classes Collection)]
        D3[(Attendance Collection)]
    end
```
