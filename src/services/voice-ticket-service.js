import apiClient from '@/api/axios';

/**
 * Voice ticket service for broker portal.
 * Calls backend endpoint with multipart audio upload.
 */
class VoiceTicketService {
  async processMicAudio(blob) {
    const formData = new FormData();
    const audioBlob = blob instanceof Blob ? blob : new Blob([blob], { type: 'audio/webm' });

    formData.append('audio', audioBlob, 'voice-note.webm');

    const response = await apiClient.post(
      'https://95b7-27-109-18-82.ngrok-free.app/broker/extract-from-audio',
      formData,
    );

    return response.data;
  }
}

const voiceTicketService = new VoiceTicketService();
export default voiceTicketService;
