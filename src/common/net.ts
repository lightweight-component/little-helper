export function response404HTML() {
    return new Response('<!DOCTYPE html><body><h1>404 Not Found.</h1><p>Not found.</p></body>',
        { headers: { "content-type": "text/html;charset=UTF-8" }, status: 404 });
}