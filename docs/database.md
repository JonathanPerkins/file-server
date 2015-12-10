## File Server Database

The file server uses the nedb database (https://www.npmjs.com/package/nedb) to
provide persistent storage of JSON records. It uses a subset of MongoDB API
and can be thought of as a node.js NoSQL version of SQLite.

See *public/record_definitions.js* for the helper functions to create new records.

The URL database is the primary configuration; the files database
exists purely for managing the available files and the categories database
simply provides a list of 'public' (well known) categories that may be used
when building a new URL.

### URL record

A file server URL path is */{category}/{file}* where {file} represents the path
and filename of the file within the file repository.

```js
{
    name: '',           // name is the URL path (/category/file), used as db and API key
    category: '',       // category name
    file: '',           // file name (and path within file repository)
    description: '',
    config: {
        enabled: false,
        count_remaining: null,
        start_time: null,
        end_time: null
    },
    stats: {
        num_downloads: 0
    }
}
```

### Category record

```js
{
    name: '',
    description: '',
    stats: {
        num_downloads: 0
    }
}
```

### File record

```js
{
    name: '',           // file name (path within file repository)
    size: 0,            // length in bytes
    md5: '',            // MD5 sum
    stats: {
        num_downloads: 0
    }
}
```
