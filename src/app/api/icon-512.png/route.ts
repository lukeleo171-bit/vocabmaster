import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET() {
  const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="110" fill="#1E1B2E"/>
    <rect x="112" y="320" width="64" height="160" rx="16" fill="#A78BFA"/>
    <rect x="224" y="192" width="64" height="288" rx="16" fill="#A78BFA"/>
    <rect x="336" y="64" width="64" height="416" rx="16" fill="#A78BFA"/>
  </svg>`
  
  try {
    const png = await sharp(Buffer.from(svg))
      .resize(512, 512)
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

