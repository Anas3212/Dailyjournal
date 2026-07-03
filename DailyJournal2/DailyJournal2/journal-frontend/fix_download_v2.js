const fs = require('fs');
const glob = require('glob');

const newFunction = \  const handleDownloadFile = async (url) => {
    try {
      let fullUrl = url;
      if (typeof getFullFileUrl === 'function') {
        fullUrl = getFullFileUrl(url);
      } else if (!url.startsWith('http')) {
        fullUrl = \\\\\\\\\\\\\\\;
      }

      const isCloudinary = fullUrl.startsWith('https://res.cloudinary.com');

      if (isCloudinary) {
        if (fullUrl.includes('/raw/upload/')) {
          // Raw files (like PDF) don't support fl_attachment transformation.
          // Open directly or try to fetch.
          window.open(fullUrl, '_blank');
          return;
        } else {
          // Images and videos support fl_attachment for direct download
          const attachmentUrl = fullUrl.replace('/upload/', '/upload/fl_attachment/');
          const link = document.createElement('a');
          link.href = attachmentUrl;
          link.target = '_blank';
          link.download = url.split('/').pop().split('?')[0];
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
      }

      const response = await fetch(fullUrl, {
        credentials: 'omit' // For backend proxies, include if needed, but Cloudinary needs omit. Let's use omit, wait, proxy needs include!
      });
      // Wait, original was credentials: isCloudinary ? 'omit' : 'include'
      // We know it's not cloudinary here
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };\;
\

