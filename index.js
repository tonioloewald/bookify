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
    const id = levelPrefix + '_' + title.replace(/[ \/:,.]+/g, '_').substr(0, 12)
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
      default:
        section.lines.push(line)
        break;
    }
  }
  
  const wordMaps = {} // map from section id to map of word-frequencies
    
  for (const section of sections) {
    const {
      id,
      title,
      lines
    } = section
    let body = lines.join('\n')
    // TODO process images
    // - add captions if they are missing
    // - consider renaming images currently named "Dragged|pasted|Screen"
    // - consider processing pngs into jpgs
    const images = body.match(/\!\[[^\n]*\]\([^\n]*\)/g)
    body = body.replace(/(\!\[[^\n]*\]\([^\n]*)(\.png|\.pdf)\)/g, '\1.jpg)')
    // if (images) console.log(id, images.length)
    const wordMap = (body.match(/[\w-]+/g) || [])
      .filter(word => word.length > 3)
      .map(word => word.toLocaleLowerCase())
      .reduce((acc, word) => { 
        acc[word] = acc[word] ? acc[word] + 1 : 1;
        return acc;
      }, {})
    
    wordMaps[id] = wordMap;
    
    writeFile(targetPath + id + '.md', body, 'utf8')
  }
  
  const imageFiles = (await readdir(path)).filter(file => file.match(/(\.png|\.pdf|\.jpeg|\.jpg)$/))
  imageFiles.forEach(file => {
    const sourcePath = path + file
    const destPath = targetPath + file.replace(/\.\w+$/, '.jpg')
    exec(`sips -s format jpeg "${sourcePath}" --out "${destPath}"`)
  })
}

main();
