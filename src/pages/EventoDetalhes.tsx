import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Music, Users, FileText, ExternalLink, ArrowLeft, ChevronDown, Download, Printer } from "lucide-react";
import jsPDF from 'jspdf';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useEvents } from "@/hooks/useEvents";
import { useEventSongs } from "@/hooks/useEventSongs";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChordTransposer from "@/components/ChordTransposer";
import Metronome from "@/components/Metronome";

const EventoDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEvents();
  const event = events.find(e => e.id === id);
  const { data: eventSongs = [] } = useEventSongs(id || '');
  const { data: participants = [] } = useEventParticipants(id || '');
  const [activeTab, setActiveTab] = useState("info");
  const [transposedChords, setTransposedChords] = useState<Record<string, string>>({});
  const [transposedLyrics, setTransposedLyrics] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-worship flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Evento não encontrado</h2>
          <Button onClick={() => navigate('/agenda')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agenda
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Parse attachments
  let attachments: Array<{name: string; url: string; type: string}> = [];
  try {
    if (event.attachments) {
      attachments = JSON.parse(event.attachments);
    }
  } catch (e) {
    console.error('Error parsing attachments:', e);
  }

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handlePrintScale = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const eventDate = formatDate(event.event_date);
    const eventTime = escapeHtml(event.event_time);
    const eventLocation = escapeHtml(event.location || 'Local não informado');
    const eventTitle = escapeHtml(event.title);

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Escala - ${eventTitle}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .event-info {
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ccc;
          }
          .song-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .song-number {
            display: inline-block;
            background: #333;
            color: white;
            padding: 5px 15px;
            border-radius: 5px;
            font-weight: bold;
            margin-right: 10px;
          }
          .song-title {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0 5px 0;
          }
          .song-artist {
            color: #666;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .song-details {
            font-size: 13px;
            color: #666;
            margin-top: 8px;
            margin-bottom: 10px;
          }
          .song-details span {
            margin-right: 15px;
          }
          .lyrics-section {
            margin-top: 15px;
            padding: 15px;
            background: #fafafa;
            border-radius: 5px;
            white-space: pre-wrap;
            font-size: 12px;
            line-height: 1.6;
          }
          .team-member {
            padding: 10px;
            margin-bottom: 8px;
            background: #f5f5f5;
            border-radius: 5px;
            border-left: 3px solid #333;
          }
          .team-member-name {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .team-member-role {
            font-size: 12px;
            color: #666;
          }
          .metronome-info {
            padding: 15px;
            background: #e8f4f8;
            border-radius: 5px;
            border-left: 4px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${eventTitle}</h1>
          <div class="event-info">
            <strong>Data:</strong> ${escapeHtml(eventDate)}<br>
            <strong>Horário:</strong> ${eventTime}${event.end_time ? ` - ${escapeHtml(event.end_time)}` : ''}<br>
            <strong>Local:</strong> ${eventLocation}
            ${event.description ? `<br><br><strong>Descrição:</strong><br>${escapeHtml(event.description)}` : ''}
            ${event.notes ? `<br><br><strong>Observações:</strong><br>${escapeHtml(event.notes)}` : ''}
          </div>
        </div>

        ${participants.length > 0 ? `
        <div class="section">
          <div class="section-title">Equipe</div>
          ${participants.map(p => `
            <div class="team-member">
              <div class="team-member-name">${escapeHtml(p.profile?.display_name || 'Sem nome')}</div>
              ${p.profile?.ministry_function ? `<div class="team-member-role">${escapeHtml(p.profile.ministry_function)}</div>` : ''}
              ${p.confirmed ? '<div style="color: green; font-size: 11px; margin-top: 4px;">✓ Confirmado</div>' : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${eventSongs.length > 0 ? `
        <div class="section">
          <div class="section-title">Repertório</div>
          ${eventSongs.map((eventSong, index) => {
            const song = eventSong.song;
            if (!song) return '';
            return `
            <div class="song-item">
              <div>
                <span class="song-number">${index + 1}</span>
                <span class="song-title">${escapeHtml(song.title)}</span>
              </div>
              <div class="song-artist">${escapeHtml(song.artist)}</div>
              <div class="song-details">
                ${song.musical_key ? `<span><strong>Tom:</strong> ${escapeHtml(song.musical_key)}</span>` : ''}
                ${song.bpm ? `<span><strong>BPM:</strong> ${song.bpm}</span>` : ''}
              </div>
            </div>
            `;
          }).join('')}
        </div>
        ` : ''}
    `;

    // Metrônomo
    const bpmValues = eventSongs.map(es => es.song?.bpm).filter(BPM => BPM !== null && BPM !== undefined);
    if (bpmValues.length > 0) {
      const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
      htmlContent += `
        <div class="section">
          <div class="section-title">Metrônomo</div>
          <div class="metronome-info">
            <strong>BPM Médio:</strong> ${avgBpm} BPM<br>
            <small>Baseado nas músicas do repertório</small>
          </div>
        </div>
      `;
    }

    htmlContent += `
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadScale = () => {
    const eventDate = formatDate(event.event_date);
    const eventTime = event.event_time;
    const eventLocation = event.location || 'Local não informado';
    const eventTitle = event.title;

    // Criar PDF com design clean e minimalista
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Cores clean
    const primaryColor = [102, 126, 234]; // #667eea
    const textColor = [45, 55, 72]; // #2d3748
    const lightGray = [226, 232, 240]; // #e2e8f0
    const mediumGray = [160, 174, 192]; // #a0aec0

    // Título do evento - Clean e minimalista
    doc.setTextColor(...textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(eventTitle, margin, yPosition, { maxWidth: contentWidth, align: 'left' });

    yPosition += 15;

    // Informações do evento - Clean
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const infoLines = [
      `Data: ${eventDate}`,
      `Horário: ${eventTime}${event.end_time ? ` - ${event.end_time}` : ''}`,
      `Local: ${eventLocation}`
    ];

    infoLines.forEach((line, index) => {
      doc.text(line, margin, yPosition + (index * 6));
    });

    yPosition += 25;

    if (event.description) {
      doc.setFont('helvetica', 'bold');
      doc.text('Descrição:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(event.description, contentWidth);
      doc.text(descLines, margin, yPosition);
      yPosition += descLines.length * 5 + 5;
    }

    if (event.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(event.notes, contentWidth);
      doc.text(notesLines, margin, yPosition);
      yPosition += notesLines.length * 5 + 10;
    }

    // Linha separadora
    doc.setDrawColor(...lightGray);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Equipe - Clean
    if (participants.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Equipe', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);

      participants.forEach((p) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        const name = p.profile?.display_name || 'Sem nome';
        const role = p.profile?.ministry_function || '';
        const confirmed = p.confirmed ? '✓ Confirmado' : '';

        doc.setFont('helvetica', 'bold');
        doc.text(`• ${name}`, margin + 5, yPosition);
        yPosition += 5;

        if (role) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...mediumGray);
          doc.text(`  ${role}`, margin + 5, yPosition);
          yPosition += 5;
        }

        if (confirmed) {
          doc.setTextColor(16, 185, 129); // green
          doc.text(`  ${confirmed}`, margin + 5, yPosition);
          yPosition += 5;
        }

        doc.setTextColor(...textColor);
        yPosition += 3;
      });

      yPosition += 5;
      doc.setDrawColor(...lightGray);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }

    // Repertório - Clean e intuitivo
    if (eventSongs.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Repertório', margin, yPosition);
      yPosition += 8;

      eventSongs.forEach((eventSong, index) => {
        const song = eventSong.song;
        if (!song) return;

        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        // Número da música - círculo clean
        doc.setFillColor(...primaryColor);
        doc.circle(margin + 5, yPosition - 2, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(String(index + 1), margin + 5, yPosition, { align: 'center' });

        // Título da música
        doc.setTextColor(...textColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(song.title, margin + 15, yPosition);

        yPosition += 6;

        // Artista
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...mediumGray);
        doc.text(song.artist || 'Artista não informado', margin + 15, yPosition);

        yPosition += 6;

        // Detalhes (Tom e BPM) - Clean
        const details = [];
        if (song.musical_key) details.push(`Tom: ${song.musical_key}`);
        if (song.bpm) details.push(`BPM: ${song.bpm}`);

        if (details.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(...textColor);
          doc.text(details.join(' • '), margin + 15, yPosition);
          yPosition += 6;
        }

        yPosition += 5;
      });

      yPosition += 5;
      doc.setDrawColor(...lightGray);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }

    // Metrônomo - Clean
    const bpmValues = eventSongs.map(es => es.song?.bpm).filter(BPM => BPM !== null && BPM !== undefined);
    if (bpmValues.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Metrônomo', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text(`BPM Médio: ${avgBpm} BPM`, margin, yPosition);
      yPosition += 6;
      doc.setFontSize(9);
      doc.setTextColor(...mediumGray);
      doc.text('Baseado nas músicas do repertório', margin, yPosition);
    }

    // Salvar PDF
    const fileName = `Escala_${eventTitle.replace(/[^a-z0-9]/gi, '_')}_${eventDate.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleDownloadScaleOld = () => {
    const eventDate = formatDate(event.event_date);
    const eventTime = escapeHtml(event.event_time);
    const eventLocation = escapeHtml(event.location || 'Local não informado');
    const eventTitle = escapeHtml(event.title);

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escala - ${eventTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px 20px;
            color: #1a1a1a;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            line-height: 1.6;
            min-height: 100vh;
          }
          
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .event-info {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            font-size: 15px;
            line-height: 1.8;
          }
          
          .event-info strong {
            display: inline-block;
            min-width: 80px;
            font-weight: 600;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .section:last-child {
            margin-bottom: 0;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #667eea;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .section-title::before {
            content: '';
            width: 4px;
            height: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
          }
          
          .team-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .team-member {
            padding: 18px;
            background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .team-member:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .team-member-name {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 6px;
            color: #2d3748;
          }
          
          .team-member-role {
            font-size: 13px;
            color: #667eea;
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          .team-member-confirmed {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #10b981;
            font-size: 12px;
            font-weight: 500;
            margin-top: 8px;
          }
          
          .song-item {
            margin-bottom: 24px;
            page-break-inside: avoid;
            padding: 24px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            transition: all 0.2s;
          }
          
          .song-item:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
          }
          
          .song-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 12px;
          }
          
          .song-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            font-weight: 700;
            font-size: 18px;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }
          
          .song-title {
            font-size: 20px;
            font-weight: 700;
            color: #2d3748;
            flex: 1;
          }
          
          .song-artist {
            color: #667eea;
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 12px;
            margin-left: 55px;
          }
          
          .song-details {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #4a5568;
            margin-left: 55px;
          }
          
          .song-detail-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .song-detail-badge {
            background: #e2e8f0;
            color: #4a5568;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 13px;
          }
          
          .lyrics-section {
            margin-top: 16px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.8;
            color: #2d3748;
            border-left: 4px solid #667eea;
            margin-left: 55px;
          }
          
          .metronome-info {
            padding: 24px;
            background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
            border-radius: 12px;
            border-left: 4px solid #0ea5e9;
            box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
          }
          
          .metronome-info strong {
            font-size: 18px;
            color: #0c4a6e;
            display: block;
            margin-bottom: 8px;
          }
          
          .metronome-info small {
            color: #075985;
            font-size: 13px;
          }
          
          .info-box {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 10px;
            margin-top: 12px;
            border-left: 4px solid #667eea;
            font-size: 14px;
            line-height: 1.7;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .container {
              box-shadow: none;
              border-radius: 0;
            }
            
            .song-item:hover,
            .team-member:hover {
              transform: none;
            }
          }
          
          @media (max-width: 768px) {
            body {
              padding: 20px 10px;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .header {
              padding: 30px 20px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .team-grid {
              grid-template-columns: 1fr;
            }
            
            .song-artist,
            .song-details,
            .lyrics-section {
              margin-left: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${eventTitle}</h1>
            <div class="event-info">
              <div><strong>📅 Data:</strong> ${escapeHtml(eventDate)}</div>
              <div><strong>🕐 Horário:</strong> ${eventTime}${event.end_time ? ` - ${escapeHtml(event.end_time)}` : ''}</div>
              <div><strong>📍 Local:</strong> ${eventLocation}</div>
              ${event.description ? `<div class="info-box" style="margin-top: 16px; text-align: left;"><strong>📝 Descrição:</strong><br>${escapeHtml(event.description)}</div>` : ''}
              ${event.notes ? `<div class="info-box" style="margin-top: 12px; text-align: left;"><strong>📌 Observações:</strong><br>${escapeHtml(event.notes)}</div>` : ''}
            </div>
          </div>

          <div class="content">
            ${participants.length > 0 ? `
            <div class="section">
              <div class="section-title">👥 Equipe</div>
              <div class="team-grid">
                ${participants.map(p => `
                  <div class="team-member">
                    <div class="team-member-name">${escapeHtml(p.profile?.display_name || 'Sem nome')}</div>
                    ${p.profile?.ministry_function ? `<div class="team-member-role">${escapeHtml(p.profile.ministry_function)}</div>` : ''}
                    ${p.confirmed ? '<div class="team-member-confirmed">✓ Confirmado</div>' : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            ${eventSongs.length > 0 ? `
            <div class="section">
              <div class="section-title">🎵 Repertório</div>
              ${eventSongs.map((eventSong, index) => {
                const song = eventSong.song;
                if (!song) return '';
                return `
                <div class="song-item">
                  <div class="song-header">
                    <div class="song-number">${index + 1}</div>
                    <div class="song-title">${escapeHtml(song.title)}</div>
                  </div>
                  <div class="song-artist">${escapeHtml(song.artist || 'Artista não informado')}</div>
                  ${(song.musical_key || song.bpm) ? `
                  <div class="song-details">
                    ${song.musical_key ? `<div class="song-detail-item"><span class="song-detail-badge">🎹 Tom: ${escapeHtml(song.musical_key)}</span></div>` : ''}
                    ${song.bpm ? `<div class="song-detail-item"><span class="song-detail-badge">🥁 BPM: ${song.bpm}</span></div>` : ''}
                  </div>
                  ` : ''}
                  ${song.lyrics ? `
                  <div class="lyrics-section">
                    <strong style="display: block; margin-bottom: 8px; color: #667eea;">Letra:</strong>
                    ${escapeHtml(song.lyrics)}
                  </div>
                  ` : ''}
                </div>
                `;
              }).join('')}
            </div>
            ` : ''}

            ${(() => {
              const bpmValues = eventSongs.map(es => es.song?.bpm).filter(BPM => BPM !== null && BPM !== undefined);
              if (bpmValues.length > 0) {
                const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
                return `
                  <div class="section">
                    <div class="section-title">🎚️ Metrônomo</div>
                    <div class="metronome-info">
                      <strong>BPM Médio: ${avgBpm} BPM</strong>
                      <small>Baseado nas músicas do repertório</small>
                    </div>
                  </div>
                `;
              }
              return '';
            })()}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Escala_${eventTitle.replace(/[^a-z0-9]/gi, '_')}_${eventDate.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-2 sm:p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/agenda')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agenda
          </Button>
          
          <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-lg border">
            <h1 className="text-4xl font-bold text-primary mb-4">{event.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge 
                variant={event.event_type === 'evento' ? 'default' : 'secondary'}
                className={`text-base px-3 py-1 ${
                  event.event_type === 'evento' 
                    ? 'bg-gradient-divine text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {event.event_type === 'evento' ? '🎵 Evento' : '🎹 Ensaio'}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{formatDate(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{event.event_time}{event.end_time && ` - ${event.end_time}`}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="repertorio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Music className="h-4 w-4 mr-2" />
              Repertório ({eventSongs.length})
            </TabsTrigger>
            <TabsTrigger value="equipe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Equipe ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="metronomo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Metrônomo
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="space-y-4">
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </CardContent>
              </Card>
            )}

            {event.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observações Importantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.notes}</p>
                </CardContent>
              </Card>
            )}

            {attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Links e Materiais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <span className="flex-1 text-sm font-medium group-hover:text-primary">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground">Abrir ↗</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Repertório */}
          <TabsContent value="repertorio" className="space-y-6">
            {eventSongs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma música adicionada ao repertório</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Botões de Download e Impressão */}
                <div className="flex gap-2 justify-end">
                  <Button 
                    onClick={handleDownloadScale}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Escala
                  </Button>
                  <Button 
                    onClick={handlePrintScale}
                    variant="outline"
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Escala
                  </Button>
                </div>
                {eventSongs.map((eventSong, index) => (
                <Card key={eventSong.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
                    <div className="flex items-start gap-4">
                      <Badge variant="default" className="bg-primary text-primary-foreground text-xl px-4 py-2 font-bold">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-2xl">{eventSong.song?.title}</CardTitle>
                        <p className="text-base text-muted-foreground font-medium">
                          {eventSong.song?.artist}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {eventSong.song?.musical_key && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                              🎵 Tom: {eventSong.song.musical_key}
                            </Badge>
                          )}
                          {eventSong.song?.bpm && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                              ⚡ {eventSong.song.bpm} BPM
                            </Badge>
                          )}
                          {eventSong.song?.category && (
                            <Badge variant="outline">{eventSong.song.category}</Badge>
                          )}
                        </div>
                       </div>
                       {/* Links da Música (YouTube, Spotify, etc) */}
                       {eventSong.song?.links && Array.isArray(eventSong.song.links) && eventSong.song.links.length > 0 && (
                         <div className="flex flex-wrap gap-2 mt-3">
                           {eventSong.song.links.map((link, linkIndex) => (
                             <a
                               key={linkIndex}
                               href={link.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors text-sm font-medium"
                             >
                               <ExternalLink className="h-3.5 w-3.5" />
                               <span>{link.name}</span>
                             </a>
                           ))}
                         </div>
                       )}
                     </div>
                   </CardHeader>
                   <CardContent className="pt-6 space-y-6">
                     {/* Transpositor de Acordes */}
                    {(eventSong.song?.chords || eventSong.song?.lyrics) && (
                      <ChordTransposer
                        originalKey={eventSong.song?.musical_key}
                        chords={eventSong.song?.chords || eventSong.song?.lyrics}
                        onTranspose={(transposed, semitones) => {
                          const songId = eventSong.id;
                          if (eventSong.song?.chords) {
                            setTransposedChords(prev => ({ ...prev, [songId]: transposed }));
                          }
                          if (eventSong.song?.lyrics) {
                            setTransposedLyrics(prev => ({ ...prev, [songId]: transposed }));
                          }
                        }}
                      />
                    )}

                    {/* Accordion para Cifra e Letra */}
                    {(eventSong.song?.chords || eventSong.song?.lyrics) && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="content" className="border rounded-lg">
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-2 text-lg font-bold text-primary">
                              <Music className="h-5 w-5" />
                              <span>Cifra e Letra</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-6 pt-4">
                              {/* Cifras */}
                              {eventSong.song?.chords && (
                                <div className="space-y-3">
                                  <h4 className="font-bold text-base flex items-center gap-2 text-foreground">
                                    <Music className="h-4 w-4" />
                                    Cifra e Acordes
                                  </h4>
                                  <div className="p-6 bg-muted/50 rounded-lg border-2 border-primary/10">
                                    <pre className="font-mono text-base whitespace-pre-wrap leading-loose tracking-wide">
                                      {transposedChords[eventSong.id] || eventSong.song.chords}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Letra */}
                              {eventSong.song?.lyrics && (
                                <div className="space-y-3">
                                  <h4 className="font-bold text-base flex items-center gap-2 text-foreground">
                                    <FileText className="h-4 w-4" />
                                    Letra
                                  </h4>
                                  <div className="p-6 bg-accent/20 rounded-lg border">
                                    <pre className="text-base whitespace-pre-wrap leading-loose">
                                      {transposedLyrics[eventSong.id] || eventSong.song.lyrics}
                                    </pre>
                                   </div>
                                 </div>
                               )}

                              {/* Links da música (YouTube, Spotify, etc) */}
                              {eventSong.song?.links && Array.isArray(eventSong.song.links) && eventSong.song.links.length > 0 && (
                                <Card className="bg-card/60 border-primary/10">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      <ExternalLink className="h-4 w-4" />
                                      Links da música
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-0 flex flex-wrap gap-2">
                                    {eventSong.song.links.map((link, linkIndex) => (
                                      <a
                                        key={linkIndex}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-accent transition-colors text-sm font-medium"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span>{link.name}</span>
                                      </a>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}
                             </div>
                           </AccordionContent>
                         </AccordionItem>
                       </Accordion>
                     )}

                    {!eventSong.song?.chords && !eventSong.song?.lyrics && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma cifra ou letra disponível para esta música
                      </p>
                    )}
                  </CardContent>
                </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* Tab: Equipe */}
          <TabsContent value="equipe">
            {participants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum participante confirmado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((participant) => (
                  <Card key={participant.user_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">
                              {participant.profile?.display_name || 'Sem nome'}
                            </h4>
                            {participant.profile?.ministry_function && (
                              <Badge variant="secondary" className="text-xs">
                                {participant.profile.ministry_function}
                              </Badge>
                            )}
                          </div>
                          {participant.confirmed && (
                            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                              ✓ Confirmado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Metrônomo */}
          <TabsContent value="metronomo">
            <div className="max-w-md mx-auto">
              <Metronome defaultBpm={eventSongs[0]?.song?.bpm} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventoDetalhes;


