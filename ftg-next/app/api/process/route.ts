import { NextResponse } from 'next/server';
import { setStoredData } from '../../../lib/store';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gridPosition } = body;

        if (gridPosition) {
            setStoredData({ gridPosition });
            return NextResponse.json({ message: 'Points received and processed successfully' });
        } else {
            return NextResponse.json({ error: 'gridPosition is required' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process points' }, { status: 500 });
    }
}
