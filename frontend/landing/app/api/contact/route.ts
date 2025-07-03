import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send notification email to team
    const { data: notificationData, error: notificationError } = await resend.emails.send({
      from: 'autarky-energy.net', 
       to: ['tatiana.c.g.grandon@ntnu.no', 'alessandro.onori@ntnu.no'],// Your email for testing - forward manually to team
      subject: `[AUTARKY] Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0097B2;">New Contact Form Submission</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #0097B2; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Message</h3>
            <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This email was sent from the Autarky contact form.</p>
            <p><strong>Action Required:</strong> Please forward this message to tatiana.c.g.grandon@ntnu.no and alessandro.onori@ntnu.no</p>
          </div>
        </div>
      `,
      replyTo: email,
    });

    if (notificationError) {
      console.error('Notification email error:', notificationError);
      return NextResponse.json(
        { error: 'Failed to send notification email', details: notificationError.message },
        { status: 500 }
      );
    }

    // Send confirmation email to the user
    const { data: confirmationData, error: confirmationError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email], // Send to the user who submitted the form
      subject: `Thank you for contacting Autarky!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0097B2; margin-bottom: 10px;">Thank You!</h1>
            <p style="color: #666; font-size: 18px;">We've received your message</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Message Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0097B2;">What happens next?</h3>
            <p style="line-height: 1.6; color: #333;">
              Our team will review your message and get back to you within 2-3 business days. 
              If you have any urgent questions, please don't hesitate to reach out directly.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; margin-bottom: 20px;">
              In the meantime, feel free to explore our platform:
            </p>
            <a href="https://app.autarky-energy.net/" 
               style="background-color: #0097B2; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Try Autarky
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; 
                      color: #666; font-size: 12px; text-align: center;">
            <p>This is an automated response from Autarky.</p>
            <p>Energy is not a commodity. It is a right, a relationship, and a responsibility.</p>
          </div>
        </div>
      `,
    });

    if (confirmationError) {
      console.error('Confirmation email error:', confirmationError);
      // Don't fail the request if confirmation email fails
    }

    return NextResponse.json(
      { 
        message: 'Emails sent successfully',
        notificationId: notificationData?.id,
        confirmationId: confirmationData?.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}