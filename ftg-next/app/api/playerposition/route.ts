import { NextResponse } from 'next/server';
import { getStoredData } from '../../../lib/store';

export async function GET() {
    try {
        const data = getStoredData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to retrieve player position' }, { status: 500 });
    }
}
