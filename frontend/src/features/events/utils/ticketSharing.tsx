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

async function renderTicketPdf({
  event,
  ticket,
  ticketTiers,
}: Required<ShareTicketParams>): Promise<{
  pdf: jsPDF;
  pdfBlob: Blob;
  fileName: string;
  shareText: string;
  shareSubject: string;
  eventUrl: string;
}> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise<void>((resolve) => {
      root.render(
        <TicketExportTemplate event={event} ticket={ticket} ticketTiers={ticketTiers} />,
      );
      setTimeout(resolve, 800);
    });

    const element = document.getElementById('ticket-export-root');
    if (!element) throw new Error('Export element not found');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const pdfBlob = pdf.output('blob');

    const guestName = ticket.guest_name || 'Guest';
    const eventTitle = event.title || 'Event';
    const shareSubject = `Ticket for ${eventTitle}`;
    const eventUrl = `${window.location.origin}/events-new/${event.id}`;
    const shareText = `Here is ${guestName}'s ticket for ${eventTitle}.\n\nView Event: ${eventUrl}`;

    const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '-').substring(0, 30);
    const fileName = `Invitation-${safeEventTitle}-${guestName.replace(/\s+/g, '-')}.pdf`;

    return { pdf, pdfBlob, fileName, shareText, shareSubject, eventUrl };
  } finally {
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(container);
    }, 1000);
  }
}

export const shareTicket = async ({
  event,
  ticket,
  ticketTiers = [],
}: ShareTicketParams) => {
  try {
    const { pdf, pdfBlob, fileName, shareText, shareSubject, eventUrl } = await renderTicketPdf({
      event,
      ticket,
      ticketTiers,
    });
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

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
  }
};

export const exportTicketAsPDF = async ({
  event,
  ticket,
  ticketTiers = [],
}: ShareTicketParams) => {
  try {
    const { pdf, fileName } = await renderTicketPdf({
      event,
      ticket,
      ticketTiers,
    });
    pdf.save(fileName);
    toast.success('Ticket PDF downloaded!');
  } catch (error) {
    toast.error('Failed to export PDF');
  }
};
