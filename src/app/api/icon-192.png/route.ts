import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET() {
  const svg = `<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="40" fill="#1E1B2E"/>
    <rect x="42" y="120" width="24" height="60" rx="6" fill="#A78BFA"/>
    <rect x="84" y="72" width="24" height="108" rx="6" fill="#A78BFA"/>
    <rect x="126" y="24" width="24" height="156" rx="6" fill="#A78BFA"/>
  </svg>`
  
  try {
    const png = await sharp(Buffer.from(svg))
      .resize(192, 192)
      .png()
      .toBuffer()
    
    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // Fallback to SVG if sharp fails
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
}

