const {
  readdir,
  readFile,
  access,
  mkdir,
  writeFile,
  unlink
} = require('promise-fs')

const {exec} = require('child_process')

const path = '../Learn 3D/'

async function main () {
  const targetPath = path + 'bookified/'
  let targetExists = true
  await access(targetPath)
    .then(() => { targetExists = true })
    .catch(() => { targetExists = false })
  if (targetExists) {
    const oldFiles = await readdir(targetPath)
    await Promise.all(oldFiles.map(file => unlink(targetPath + file)))
  } else {  
    await mkdir(targetPath)
  }
  
  const text = await readFile(path + 'index.md', 'utf8')
  // console.log(text.match(/^#{1,3} .*$/mg))
  const lines = text.split('\n')
  const sections = []
  const newSection = ({
    levels = [0,0,0],
    title = 'Front Matter',
    lines = [],
  }) => {
    const levelPrefix = levels.join('.').replace(/(\.0)*$/, '')
    const id = levelPrefix + '_' + title.replace(/[^\w]+/g, '_').replace(/_$/, '')
    console.log(`[${levelPrefix}] ${title}`)
    return {
      levels,
      title,
      id,
      lines,
    };
  }
  let section = newSection({})
  
  for(const line of lines) {
    const firstWord = line.split(' ')[0]
    switch(firstWord) {
      case '#':
        sections.push(section)
        section = newSection({
          levels: [section.levels[0] + 1, 0, 0],
          title: line.substr(2),
          lines: [line]
        })
        break;
      case '##':
        if (section.lines.length === 1) {
          section.lines.push(line)
        } else {
          sections.push(section)
          section = newSection({
            levels: [section.levels[0], section.levels[1] + 1, 0],
            title: line.substr(3),
            lines: [line]
          })
        }
        break;
    /*
      case '###':
        if (section.lines.length === 1) {
          section.lines.push(line)
        } else {
          sections.push(section)
          section = newSection({
            levels: [section.levels[0], section.levels[1], section.levels[2] + 1],
            title: line.substr(4),
            lines: [line]
          })
        }
        break;
    */
      default:
        section.lines.push(line)
        break;
    }
  }
  
  const wordMaps = {} // map from section id to map of word-frequencies
  const imageMap = {} // map from images to section ids
    
  for (const section of sections) {
    const {
      id,
      title,
      lines
    } = section
    let body = lines.join('\n\n')
    // TODO process images
    // - add alt text if missing
    // - consider renaming images currently named "Dragged|pasted|Screen"
    const images = body.match(/\!\[[^\n]*\]\([^\n]*\)/g)
    body = body.replace(/(\!\[[^\]]*?\]\(.*?)(\.png|\.pdf|\.jpeg)\)/g, '\n$1.jpg)\n')
    body = body.replace(/\n\s*/g, '\n\n')
    // if (images) console.log(id, images.length)
    const wordMap = (body.match(/[\w-]+/g) || [])
      .filter(word => word.length > 3)
      .map(word => word.toLocaleLowerCase())
      .reduce((acc, word) => { 
        acc[word] = acc[word] ? acc[word] + 1 : 1;
        return acc;
      }, {})
  
    
    const imageFiles = (body.match(/(\!\[[^\]]*?\]\([^())]*?\.jpg)\)/g) || [])
      .map(link => link.match(/\((.*)\)/)[1])
    
    imageFiles.forEach(imageFile => {
      if (!imageMap[imageFile]) {
        imageMap[imageFile] = [id]
      } else if (!imageMap[imageFile].includes(id)) {
        imageMap[imageFile].push(id)
      }
    });
    
    wordMaps[id] = wordMap;
    
    writeFile(targetPath + id + '.md', body, 'utf8')
  }
  writeFile(targetPath + 'wordMap.json', JSON.stringify(wordMaps, false, 2), 'utf8')
  
  // b8r documentation.json format
  const documentation = sections.reduce((chapters, section) => {
    const name = section.title
    const path = section.id + '.md'
    if (section.levels[1] === 0 || chapters.length === 0) {
      chapters.unshift({
        title: name,
        parts: [{
          name,
          path
        }]
      })
    } else {
      chapters[0].parts.push({
      name,
      path
      })
    }
    return chapters
  }, []).reverse()
  writeFile(targetPath + 'documentation.json', JSON.stringify(documentation, false, 2), 'utf8')
  
  const imageFiles = (await readdir(path)).filter(file => file.match(/(\.png|\.pdf|\.jpeg|\.jpg)$/))
  imageFiles.forEach(file => {
    const sourcePath = path + file
    const convertedFile = file.replace(/\.\w+$/, '.jpg')
    const destPath = targetPath + convertedFile
    if (imageMap[convertedFile] || imageMap[escape(convertedFile)]) {
    exec(`sips -s format jpeg "${sourcePath}" --out "${destPath}"`)
    } else {
      console.log(file, 'is not used')
    }
  })
  writeFile(targetPath + 'imageMap.json', JSON.stringify(imageMap, false, 2), 'utf8')
}

main();
