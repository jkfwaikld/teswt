
import { FieldValue } from 'firebase/firestore';

export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  driverId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedAt: any; // Firestore Timestamp
}

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  status: AttendanceStatus;
  lastMarkedDate: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
