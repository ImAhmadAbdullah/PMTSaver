import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { URL, fileURLToPath } from 'url';
import chalk from 'chalk';

const download = async (url, destination) => {
    const response = await axios({ method: 'get', url: url, responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(destination);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  };

const saveAll = async (page) => {
  try {
    const { data: html } = await axios.get(page);
    const $ = cheerio.load(html);
    const links = [];
    $('a[href$=".pdf"]').each((_, element) => {
      let pdf = $(element).attr('href');
      if (pdf) {
        pdf = new URL(pdf, page).href;
        links.push(pdf);
      }
    });
    if (links.length === 0) return console.log(chalk.yellow('No PDFs found.'));
    
    const currentDir = fileURLToPath(import.meta.url);
    const downloadsFolder = path.resolve(path.dirname(currentDir), 'downloads');
    
    if (fs.existsSync(downloadsFolder)) {
      fs.rmSync(downloadsFolder, { recursive: true, force: true });
    }
    fs.mkdirSync(downloadsFolder);
    
    await Promise.all(links.map(async (file) => {
      const fileName = decodeURIComponent(path.basename(new URL(file).pathname).replace(/%20/g, ' '));
      const filePath = path.join(downloadsFolder, fileName);
      console.log(chalk.cyan(`Downloading: ${fileName}`));
      await download(file, filePath);
    }));
    console.log(chalk.green('All PDFs downloaded.'));
    process.exit();
  } catch (err) {
    console.log(chalk.red('Error:', err));
    process.exit(1);
  }
};


saveAll('https://www.physicsandmathstutor.com/physics-revision/igcse-cie/general-physics/');
// Use any PMT link here.