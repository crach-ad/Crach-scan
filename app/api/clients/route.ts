import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/google-sheets/service';

// GET /api/clients - Get all clients (attendees) or a single client
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const id = searchParams.get('id');
    
    // If an ID is provided, return a single client
    if (id) {
      const client = await googleSheetsService.findAttendeeById(id);
      
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ client });
    }
    
    // Otherwise, return all clients, optionally filtered by search query
    let clients;
    if (query) {
      clients = await googleSheetsService.searchAttendees(query);
    } else {
      clients = await googleSheetsService.getAttendees();
    }
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
