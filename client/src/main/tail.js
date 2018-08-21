import path from 'path'
import fs from 'fs'
import _ from 'lodash'

const TEN_MB = 10 * 1024 * 1024

export default async function tailLog(store, filename, callback) {
  store.commit('statusUpdate', { logexist: false })

  let pos = 0
  let buffer = new Buffer(TEN_MB)
  let read = () =>
    new Promise(ret => {
      fs.open(filename, 'r', (err, fd) => {
        if (err) return ret(false)
        fs.read(fd, buffer, 0, buffer.length, pos, (err, bytesRead, buffer) => {
          fs.close(fd, err => {
            if (err) console.log('close fd error', err)
          })
          if (err) return ret(false)
          if (bytesRead > 0) {
            pos += bytesRead
            callback(buffer.slice(0, bytesRead))
          }
          ret(true)
        })
      })
    })

  let lastRead = new Promise(ret => {
    fs.stat(filename, (err, stat) => {
      if (err || !stat) ret(true)
      if (stat.size > TEN_MB) pos = stat.size - TEN_MB
      store.commit('statusUpdate', { logexist: true })
      ret(read())
    })
  })

  let queueRead = () => {
    lastRead = lastRead.then(success => {
      return read()
    })
  }

  fs.watchFile(filename, { persistent: false, interval: 333 }, (curr, prev) => {
    if (curr.size === 0) {
      store.commit('statusUpdate', { logexist: false })
      return
    }
    if (curr.size < prev.size) {
      store.commit('statusUpdate', { logexist: true })
      pos = 0
    }
    if (curr.size > pos) queueRead()
  })
}

/* export default async function tailLog(store, filename, callback) {
  store.commit('statusUpdate', { logexist: false })

  // Get the size of the file, if it exists
  let stat = () =>
    new Promise(ret => {
      fs.stat(filename, (err, stat) => {
        if (!err && stat) ret(stat.size)
        ret(0)
      })
    })
  let lastSize = await stat()

  // If file doesn't exist, wait for it to and then restart
  if (!lastSize) {
    await new Promise(ret => {
      let w = fs.watch(path.dirname(filename), { persistent: false }, (ev, _filename) => {
        if (_filename && path.basename(filename) === _filename) {
          w.close()
          ret()
        }
      })
    })
    return tailLog(store, filename, callback)
  }
  store.commit('statusUpdate', { logexist: true })

  // Load the initial data, restart if there's an error
  let pos = lastSize > TEN_MB ? lastSize - TEN_MB : 0
  let buffer = new Buffer(TEN_MB)
  let read = () =>
    new Promise(ret => {
      fs.open(filename, 'r', (err, fd) => {
        if (err) return ret(false)
        fs.read(fd, buffer, 0, buffer.length, pos, (err, bytesRead, buffer) => {
          fs.close(fd, err => {
            if (err) console.log('close fd error', err)
          })
          if (err) return ret(false)
          if (bytesRead > 0) {
            pos += bytesRead
            callback(buffer.slice(0, bytesRead))
          }
          ret(true)
        })
      })
    })

  let success = await read()
  if (!success) return tailLog(store, filename, callback)

  // Wait for changes
  let w
  let lastRead = Promise.resolve(true)
  let queueRead = _.throttle(ret => {
    lastRead.then(success => {
      return new Promise(_ret => {
        if (!success) {
          ret()
          _ret(false)
          return
        }
        stat().then(size => {
          if (size < lastSize) {
            ret()
            _ret(false)
            return
          }
          _ret(read())
        })
      })
    })
  }, 200)
  await new Promise(ret => {
    console.log('watching', filename)
    w = fs.watch(filename, { persistent: false }, (ev, _filename) => {
      console.log(ev, _filename)
      if (ev === 'rename') ret()
      if (ev === 'change') queueRead(ret)
    })
  })
  w.close()

  return tailLog(store, filename, callback)
} */
