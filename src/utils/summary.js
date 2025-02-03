function generateSummary(transcription) {
  try {
    // Simple summary: Take the first 150 characters or up to the first period
    const firstSentence = transcription.split('.')[0];
    const summary = firstSentence.length > 150 
      ? firstSentence.substring(0, 147) + '...'
      : firstSentence;

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Unable to generate summary.';
  }
}

module.exports = {
  generateSummary,
}; 