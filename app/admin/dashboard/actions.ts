'use server'

import { googleSheetsService } from '@/lib/google-sheets/service';
import { AttendanceRecord } from '@/lib/google-sheets/service';
import { formatDate } from '@/lib/utils';

export interface DashboardData {
  totalAttendees: number;
  totalSessions: number;
  averageAttendanceRate: number;
  upcomingSessions: number;
  nextSessionDate: string | null;
  recentSessions: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    attendeeCount: number;
    capacity: number;
  }>;
  upcomingSessionsList: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    attendeeCount: number;
    capacity: number;
  }>;
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    // Get all the data we need from Google Sheets
    const allAttendees = await googleSheetsService.getAttendees();
    const allSessions = await googleSheetsService.getSessions();
    const allAttendance = await googleSheetsService.getAllAttendance();
    
    // Current date for determining upcoming vs past sessions
    const currentDate = new Date();
    
    // Calculate total attendees
    const totalAttendees = allAttendees.length;
    
    // Calculate total sessions
    const totalSessions = allSessions.length;
    
    // Split sessions into upcoming and past
    const upcomingSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= currentDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const pastSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate < currentDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
    
    // Calculate average attendance rate (from past sessions)
    let totalAttendanceCount = 0;
    let totalCapacity = 0;
    
    // Assuming each session has a default capacity of 30 if not specified
    const DEFAULT_CAPACITY = 30;
    
    // Process past sessions for attendance metrics
    const recentSessions = pastSessions.slice(0, 3).map(session => {
      const sessionAttendance = allAttendance.filter((a: AttendanceRecord) => a.sessionId === session.id);
      const attendeeCount = sessionAttendance.length;
      
      // Add to totals for average calculation
      totalAttendanceCount += attendeeCount;
      totalCapacity += DEFAULT_CAPACITY;
      
      return {
        id: session.id,
        title: session.title,
        date: formatDate(session.date),
        time: session.time,
        attendeeCount,
        capacity: DEFAULT_CAPACITY
      };
    });
    
    // Calculate average attendance
    const averageAttendanceRate = pastSessions.length > 0 
      ? Math.round((totalAttendanceCount / totalCapacity) * 100) 
      : 0;
    
    // Process upcoming sessions
    const upcomingSessionsList = upcomingSessions.slice(0, 3).map(session => {
      // For upcoming sessions, we can only show registered attendees if any
      const sessionAttendance = allAttendance.filter((a: AttendanceRecord) => a.sessionId === session.id);
      
      return {
        id: session.id,
        title: session.title,
        date: formatDate(session.date),
        time: session.time,
        attendeeCount: sessionAttendance.length,
        capacity: DEFAULT_CAPACITY
      };
    });
    
    // Get next session date
    const nextSessionDate = upcomingSessions.length > 0 
      ? formatDate(upcomingSessions[0].date) 
      : null;
    
    return {
      totalAttendees,
      totalSessions,
      averageAttendanceRate,
      upcomingSessions: upcomingSessions.length,
      nextSessionDate,
      recentSessions,
      upcomingSessionsList
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return default values if there's an error
    return {
      totalAttendees: 0,
      totalSessions: 0,
      averageAttendanceRate: 0,
      upcomingSessions: 0,
      nextSessionDate: null,
      recentSessions: [],
      upcomingSessionsList: []
    };
  }
}
