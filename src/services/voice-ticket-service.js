import apiClient from '@/api/axios';

/**
 * Voice lead extraction for broker portal.
 * POSTs multipart audio to Frappe whitelist method.
 */
class VoiceTicketService {
  async processMicAudio(blob) {
    const formData = new FormData();
    const audioBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'audio/webm' });

    formData.append('audio', audioBlob, 'voice-note.webm');

    const response = await apiClient.post(
      '/method/devx_ai.voice_cp_portal.api.extract_lead_from_audio',
      formData,
    );

    return response.data;
  }
}

const voiceTicketService = new VoiceTicketService();
export default voiceTicketService;
