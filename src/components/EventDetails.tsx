import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, Music, Users, FileText, ExternalLink, Download, Printer } from "lucide-react";
import jsPDF from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Event } from "@/hooks/useEvents";
import { useEventSongs } from "@/hooks/useEventSongs";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChordTransposer from "@/components/ChordTransposer";
import Metronome from "@/components/Metronome";

interface EventDetailsProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetails = ({ event, open, onOpenChange }: EventDetailsProps) => {
  const { data: eventSongs = [] } = useEventSongs(event?.id || '');
  const { data: participants = [] } = useEventParticipants(event?.id || '');
  const [activeTab, setActiveTab] = useState("info");
  const [transposedChords, setTransposedChords] = useState<Record<string, string>>({});
  const [transposedLyrics, setTransposedLyrics] = useState<Record<string, string>>({});

  if (!event) return null;

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
          
          @media print {
            @page { margin: 1cm; }
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
                    ${song.musical_key ? `<span class="song-detail-badge">🎹 Tom: ${escapeHtml(song.musical_key)}</span>` : ''}
                    ${song.bpm ? `<span class="song-detail-badge">🥁 BPM: ${song.bpm}</span>` : ''}
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

    // Função auxiliar para desenhar card
    const drawCard = (x: number, y: number, width: number, height: number, title?: string) => {
      // Borda do card
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, width, height, 2, 2, 'S');
      
      // Fundo sutil
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(x, y, width, height, 2, 2, 'F');
      
      // Borda novamente por cima
      doc.setDrawColor(...lightGray);
      doc.roundedRect(x, y, width, height, 2, 2, 'S');
      
      // Título do card se fornecido
      if (title) {
        doc.setFillColor(...primaryColor);
        doc.roundedRect(x, y, width, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 3, y + 5.5);
        doc.setTextColor(...textColor);
      }
    };

    // Card do Título do Evento
    const titleCardHeight = 15;
    drawCard(margin, yPosition, contentWidth, titleCardHeight);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(eventTitle, margin + 5, yPosition + 10, { maxWidth: contentWidth - 10, align: 'left' });
    yPosition += titleCardHeight + 10;

    // Card de Informações do Evento
    let infoCardHeight = 20;
    if (event.description) infoCardHeight += 15;
    if (event.notes) infoCardHeight += 15;
    
    drawCard(margin, yPosition, contentWidth, infoCardHeight, 'Informações do Evento');
    
    let infoY = yPosition + 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    
    doc.setFont('helvetica', 'bold');
    doc.text('📅 Data:', margin + 5, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(eventDate, margin + 25, infoY);
    infoY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('🕐 Horário:', margin + 5, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${eventTime}${event.end_time ? ` - ${event.end_time}` : ''}`, margin + 25, infoY);
    infoY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('📍 Local:', margin + 5, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(eventLocation, margin + 25, infoY);
    infoY += 8;

    if (event.description) {
      doc.setFont('helvetica', 'bold');
      doc.text('📝 Descrição:', margin + 5, infoY);
      infoY += 6;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(event.description, contentWidth - 10);
      doc.text(descLines, margin + 5, infoY);
      infoY += descLines.length * 5 + 3;
    }

    if (event.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('📌 Observações:', margin + 5, infoY);
      infoY += 6;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(event.notes, contentWidth - 10);
      doc.text(notesLines, margin + 5, infoY);
    }

    yPosition += infoCardHeight + 10;

    // Card da Equipe
    if (participants.length > 0) {
      const cardPadding = 5;
      const memberHeight = 12;
      const teamCardHeight = 15 + (participants.length * memberHeight);
      
      if (yPosition + teamCardHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      drawCard(margin, yPosition, contentWidth, teamCardHeight, '👥 Equipe');
      
      let memberY = yPosition + 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);

      participants.forEach((p) => {
        const name = p.profile?.display_name || 'Sem nome';
        const role = p.profile?.ministry_function || '';
        const confirmed = p.confirmed;

        // Nome
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        doc.text(`• ${name}`, margin + cardPadding, memberY);
        memberY += 5;

        // Função
        if (role) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...mediumGray);
          doc.text(`  ${role}`, margin + cardPadding, memberY);
          memberY += 5;
        }

        // Status de confirmação
        if (confirmed) {
          doc.setTextColor(16, 185, 129); // green
          doc.text(`  ✓ Confirmado`, margin + cardPadding, memberY);
          memberY += 5;
        } else {
          doc.setTextColor(239, 68, 68); // red
          doc.text(`  ⏳ Pendente`, margin + cardPadding, memberY);
          memberY += 5;
        }

        memberY += 2;
      });

      yPosition += teamCardHeight + 10;
    }

    // Cards do Repertório
    if (eventSongs.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('🎵 Repertório', margin, yPosition);
      yPosition += 10;

      eventSongs.forEach((eventSong, index) => {
        const song = eventSong.song;
        if (!song) return;

        let songCardHeight = 25;
        if (song.musical_key || song.bpm) songCardHeight += 5;

        if (yPosition + songCardHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Card da música
        drawCard(margin, yPosition, contentWidth, songCardHeight);
        
        // Número da música - badge
        doc.setFillColor(...primaryColor);
        doc.circle(margin + 8, yPosition + 8, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(String(index + 1), margin + 8, yPosition + 9.5, { align: 'center' });

        // Título da música
        doc.setTextColor(...textColor);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(song.title, margin + 18, yPosition + 8, { maxWidth: contentWidth - 25 });

        // Artista
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...mediumGray);
        doc.text(song.artist || 'Artista não informado', margin + 18, yPosition + 14);

        // Detalhes (Tom e BPM)
        if (song.musical_key || song.bpm) {
          const details = [];
          if (song.musical_key) details.push(`🎹 Tom: ${song.musical_key}`);
          if (song.bpm) details.push(`🥁 BPM: ${song.bpm}`);
          
          doc.setFontSize(9);
          doc.setTextColor(...textColor);
          doc.text(details.join('  •  '), margin + 18, yPosition + 20);
        }

        yPosition += songCardHeight + 8;
      });
    }

    // Card do Metrônomo
    const bpmValues = eventSongs.map(es => es.song?.bpm).filter(BPM => BPM !== null && BPM !== undefined);
    if (bpmValues.length > 0) {
      const metronomeCardHeight = 20;
      
      if (yPosition + metronomeCardHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      const avgBpm = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
      
      drawCard(margin, yPosition, contentWidth, metronomeCardHeight, '🎚️ Metrônomo');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`${avgBpm} BPM`, margin + 5, yPosition + 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mediumGray);
      doc.text('Baseado nas músicas do repertório', margin + 5, yPosition + 20);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-bold">{event.title}</DialogTitle>
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
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4 gap-2 shrink-0">
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

          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full px-6 pb-6">
            {/* Tab: Informações */}
            <TabsContent value="info" className="mt-6 space-y-4">
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
            <TabsContent value="repertorio" className="mt-6 space-y-6">
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
                eventSongs.map((eventSong, index) => (
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

                      {/* Cifra e Letra (colapsado por padrão) */}
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
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
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

                      {!eventSong.song?.chords && !eventSong.song?.lyrics && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma cifra ou letra disponível para esta música
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
                </>
              )}
            </TabsContent>

            {/* Tab: Equipe */}
            <TabsContent value="equipe" className="mt-6">
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
            <TabsContent value="metronomo" className="mt-6">
              <div className="max-w-md mx-auto">
                <Metronome defaultBpm={eventSongs[0]?.song?.bpm} />
              </div>
            </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;

