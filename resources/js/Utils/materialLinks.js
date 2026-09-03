export const classifyMaterialLink = (rawLink = '') => {
    const link = String(rawLink).trim().toLowerCase();

    if (!link) return 'document';
    if (/(youtube|youtu\.be|vimeo|wistia|loom)/i.test(link)) return 'video';
    if (/(docs\.google\.com|notion\.so|notion\.site|medium\.com|\.pdf($|\?)|\/pdf($|\?))/i.test(link)) return 'document';
    if (/(drive\.google\.com|dropbox\.com|onedrive\.live\.com|1drv\.ms)/i.test(link)) return 'drive';
    if (/(zoom\.us|meet\.google\.com|teams\.microsoft\.com)/i.test(link)) return 'meeting';
    if (/(canva\.com|figma\.com|miro\.com)/i.test(link)) return 'design';

    return 'document';
};
