import fs from 'fs';

async function fetchImages() {
  const url = 'https://www.charleskeith.com/sg';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await response.text();
  
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const srcsetRegex = /<source[^>]+srcset=["']([^"']+)["']/gi;
  
  let match;
  const images = new Set();
  
  while ((match = imgRegex.exec(html)) !== null) {
    images.add(match[1]);
  }
  while ((match = srcsetRegex.exec(html)) !== null) {
    const urls = match[1].split(',').map(s => s.trim().split(' ')[0]);
    urls.forEach(u => images.add(u));
  }
  
  // Also look for background images in styles
  const bgRegex = /url\(["']?([^"'\)]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
      if(match[1].match(/\.(jpg|jpeg|png|webp|gif|svg)/i)) {
          images.add(match[1]);
      }
  }

  // Look for any standard image paths inside JSON or data attributes
  const dataRegex = /["']([^"']+\.(?:jpg|jpeg|png|webp|gif|svg)(\?[^"']*)?)["']/gi;
  while ((match = dataRegex.exec(html)) !== null) {
      images.add(match[1]);
  }

  const validImages = Array.from(images).filter(url => 
    url.startsWith('http') || url.startsWith('/')
  );

  fs.writeFileSync('images_list.txt', validImages.join('\n'));
  console.log(`Found ${validImages.length} images. List saved to images_list.txt`);
}

fetchImages().catch(console.error);
