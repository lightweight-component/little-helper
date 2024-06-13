const b2Domain: string = 'files.jross.me'; // configure this as per instructions above
const b2Bucket: string = 'jross-files'; // configure this as per instructions above
const b2UrlPath = `/file/${b2Bucket}/`;
const corsFileTypes: string[] = ['png', 'jpg', 'gif', 'jpeg', 'webp'];// define the file extensions we wish to add basic access control headers to
// backblaze returns some additional headers that are useful for debugging, but unnecessary in production. We can remove these to save some size
const removeHeaders: string[] = [
    'x-bz-content-sha1',
    'x-bz-file-id',
    'x-bz-file-name',
    'x-bz-info-src_last_modified_millis',
    'X-Bz-Upload-Timestamp',
    'Expires'
];
const expiration: number = 31536000; // override browser cache for images - 1 year

// define a function we can re-use to fix headers
function fixHeaders(url: URL, status: number, headers: {}): Headers {
    let newHdrs = new Headers(headers);

    if (corsFileTypes.includes(url.pathname.split('.').pop()))    // add basic cors headers for images
        newHdrs.set('Access-Control-Allow-Origin', '*');

    if (status === 200)  // override browser cache for files when 200
        newHdrs.set('Cache-Control', "public, max-age=" + expiration);
    else
        newHdrs.set('Cache-Control', 'public, max-age=300');// only cache other things for 5 minutes

    // set ETag for efficient caching where possible
    const ETag: string | null = newHdrs.get('x-bz-content-sha1') || newHdrs.get('x-bz-info-src_last_modified_millis') || newHdrs.get('x-bz-file-id');

    if (ETag)
        newHdrs.set('ETag', ETag);

    removeHeaders.forEach(header => newHdrs.delete(header));// remove unnecessary headers

    return newHdrs;
};

async function fileReq(event) {
    const cache: Cache = caches.default; // Cloudflare edge caching
    const url: URL = new URL(event.request.url);

    if (url.host === b2Domain && !url.pathname.startsWith(b2UrlPath))
        url.pathname = b2UrlPath + url.pathname;

    let response = await cache.match(url); // try to find match for this request in the edge cache

    if (response) {
        // use cache found on Cloudflare edge. Set X-Worker-Cache header for helpful debug
        let newHdrs = fixHeaders(url, response.status, response.headers);
        newHdrs.set('X-Worker-Cache', "true");

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHdrs
        });
    }

    // no cache, fetch image, apply Cloudflare lossless compression
    response = await fetch(url, { cf: { polish: "lossless" } });
    let newHdrs: Headers = fixHeaders(url, response.status, response.headers);

    response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHdrs
    });

    event.waitUntil(cache.put(url, response.clone()));

    return response;
}

addEventListener('fetch', event => event.respondWith(fileReq(event)));