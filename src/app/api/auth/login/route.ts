import { NextResponse } from 'next/server';

export async function POST() {
    // Mock login for MVP
    return NextResponse.json({
        success: true,
        token: "mock-jwt-token",
        user: {
            id: "default-user",
            email: "user@example.com",
            name: "Demo User"
        }
    });
}
