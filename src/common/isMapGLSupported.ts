/**
 * Determines whether MapGL API supports the current user browser
 *
 * @ https://github.com/mapbox/mapbox-gl-supported/blob/gh-pages/index.js
 */

export function isMapGLSupported(options?: { failIfMajorPerformanceCaveat: boolean }): boolean {
    return !notSupportedReason(options);
}

export function notSupportedReason(options?: { failIfMajorPerformanceCaveat: boolean }) {
    if (!isBrowser()) {
        return 'not a browser';
    }
    if (!isArraySupported()) {
        return 'insufficent Array support';
    }
    if (!isFunctionSupported()) {
        return 'insufficient Function support';
    }
    if (!isObjectSupported()) {
        return 'insufficient Object support';
    }
    if (!isJSONSupported()) {
        return 'insufficient JSON support';
    }
    if (!isDomMethodsSupported()) {
        return 'insufficient DOM support';
    }
    if (!isWorkerSupported()) {
        return 'insufficient worker support';
    }
    if (!isArrayBufferSupported()) {
        return 'insufficient ArrayBuffer support';
    }
    if (!isCanvasGetImageDataSupported()) {
        return 'insufficient Canvas/getImageData support';
    }
    if (!isWebGLSupportedCached((options && options.failIfMajorPerformanceCaveat) || false)) {
        return 'insufficient WebGL support';
    }
    if (!isNotIE()) {
        return 'insufficient ECMAScript 6 support';
    }
}

function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isArraySupported() {
    return (
        Array.prototype &&
        Array.prototype.every &&
        Array.prototype.filter &&
        Array.prototype.forEach &&
        Array.prototype.indexOf &&
        Array.prototype.map &&
        Array.prototype.some &&
        Array.prototype.reduce &&
        Array.isArray
    );
}

function isFunctionSupported(): boolean {
    return Boolean(Function.prototype && Function.prototype.bind);
}

function isObjectSupported(): boolean {
    return Boolean(
        Object.keys &&
            Object.assign &&
            Object.create &&
            Object.getPrototypeOf &&
            Object.getOwnPropertyNames &&
            Object.getOwnPropertyDescriptor &&
            Object.defineProperty &&
            Object.freeze,
    );
}

function isJSONSupported(): boolean {
    return 'JSON' in window && 'parse' in JSON && 'stringify' in JSON;
}

function isWorkerSupported(): boolean {
    if (!('Worker' in window && 'Blob' in window && 'URL' in window)) {
        return false;
    }

    const blob = new Blob([''], { type: 'text/javascript' });
    const workerURL = URL.createObjectURL(blob);
    let supported: boolean;
    let worker: Worker | null = null;

    try {
        worker = new Worker(workerURL);
        supported = true;
    } catch (e) {
        supported = false;
    }

    if (worker) {
        worker.terminate();
    }
    URL.revokeObjectURL(workerURL);

    return supported;
}

function isDomMethodsSupported(): boolean {
    const sampleDomEl = document.createElement('div');

    return sampleDomEl && typeof sampleDomEl.after === 'function';
}

// https://github.com/mapbox/mapbox-gl-supported/issues/19
function isArrayBufferSupported(): boolean {
    return !!ArrayBuffer.isView;
}

// Some browsers or browser extensions block access to canvas data to prevent fingerprinting.
function isCanvasGetImageDataSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) {
        return false;
    }
    const imageData = context.getImageData(0, 0, 1, 1);
    return imageData && imageData.width === canvas.width;
}

const isWebGLSupportedCache: { [key: string]: boolean } = {};
function isWebGLSupportedCached(failIfMajorPerformanceCaveat: boolean): boolean {
    const optionsKey = String(failIfMajorPerformanceCaveat);
    if (isWebGLSupportedCache[optionsKey] === undefined) {
        isWebGLSupportedCache[optionsKey] = isWebGLSupported(failIfMajorPerformanceCaveat);
    }

    return isWebGLSupportedCache[optionsKey];
}

function getWebGLContext(failIfMajorPerformanceCaveat: boolean): WebGLRenderingContext | false {
    const canvas = document.createElement('canvas');

    const attributes = {
        antialias: false,
        stencil: true,
        failIfMajorPerformanceCaveat,
    };

    if (!('WebGLRenderingContext' in window)) {
        return false;
    }

    return (canvas.getContext('webgl', attributes) ||
        canvas.getContext('experimental-webgl', attributes)) as WebGLRenderingContext;
}

function isWebGLSupported(failIfMajorPerformanceCaveat: boolean): boolean {
    const gl = getWebGLContext(failIfMajorPerformanceCaveat);
    if (!gl) {
        return false;
    }

    const extensionSupported = Boolean(
        gl.getExtension('OES_vertex_array_object') &&
            gl.getExtension('OES_element_index_uint') &&
            gl.getExtension('OES_standard_derivatives'),
    );
    if (!extensionSupported) {
        return false;
    }

    // Try compiling a shader and get its compile status. Some browsers like Brave block this API
    // to prevent fingerprinting. Unfortunately, this also means that map won't work.
    let shader;
    try {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } catch (e) {
        // some older browsers throw an exception that `createShader` is not defined
        // so handle this separately from the case where browsers block `createShader`
        // for security reasons
        return false;
    }

    if (!shader || gl.isContextLost()) {
        return false;
    }
    gl.shaderSource(shader, 'void main() {}');
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true;
}

function isNotIE() {
    return !(document as any).documentMode;
}
