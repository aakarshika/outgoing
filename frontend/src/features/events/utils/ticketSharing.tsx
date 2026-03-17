import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TicketExportTemplate } from '../components/TicketExportTemplate';

interface ShareTicketParams {
  event: any;
  ticket: any;
  ticketTiers?: any[];
}

export const shareTicket = async ({ event, ticket, ticketTiers = [] }: ShareTicketParams) => {
  // 1. Create a container for the template
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  const root = createRoot(container);
  
  try {
    // 2. Render the template
    await new Promise<void>((resolve) => {
      root.render(
        <TicketExportTemplate 
          event={event} 
          ticket={ticket} 
          ticketTiers={ticketTiers} 
        />
      );
      // Wait a bit for layout and image loading (approximate)
      setTimeout(resolve, 800); 
    });

    const element = document.getElementById('ticket-export-root');
    if (!element) throw new Error('Export element not found');

    // 3. Capture with high scale for quality
    const canvas = await html2canvas(element, { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // 4. Generate PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const pdfBlob = pdf.output('blob');
    
    // 5. Construct Share Data & Clipboard Fallback
    const guestName = ticket.guest_name || 'Guest';
    const eventTitle = event.title || 'Event';
    const shareSubject = `Ticket for ${eventTitle}`;
    const eventUrl = `${window.location.origin}/events/${event.slug || event.id}`;
    const shareText = `Here is ${guestName}'s ticket for ${eventTitle}.\n\nView Event: ${eventUrl}`;
    
    // Clean filename
    const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
    const fileName = `Invitation-${safeEventTitle}-${guestName.replace(/\s+/g, '-')}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    // Fallback: Proactively copy to clipboard because some apps (WhatsApp) 
    // might ignore the 'text' field when 'files' are shared.
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }

    const shareData: ShareData = {
      title: shareSubject,
      text: shareText,
      // Some browsers ignore 'url' when 'files' are present, 
      // so we include it in 'text' above as well.
      url: eventUrl, 
      files: [pdfFile],
    };

    // 6. Share or Download Fallback
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      toast.success('Ticket shared! (Link also copied to clipboard)');
    } else {
      pdf.save(fileName);
      toast.success('Ticket downloaded & link copied!');
    }
  } catch (error) {
    console.error('Sharing failed:', error);
    toast.error('Failed to share ticket');
  } finally {
    // 7. Cleanup
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(container);
    }, 1000);
  }
};

export const exportTicketAsPDF = async ({ event, ticket, ticketTiers = [] }: ShareTicketParams) => {
    // Reuse similar logic for direct export if needed
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    
    try {
      await new Promise<void>((resolve) => {
        root.render(<TicketExportTemplate event={event} ticket={ticket} ticketTiers={ticketTiers} />);
        setTimeout(resolve, 800);
      });

      const element = document.getElementById('ticket-export-root');
      if (!element) throw new Error('Export element not found');

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Ticket-${ticket.barcode || 'Export'}.pdf`);
      toast.success('Ticket PDF downloaded!');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(container);
      }, 1000);
    }
};
