import type { NextConfig } from 'next';
const config:NextConfig={devIndicators:false,allowedDevOrigins:['*.e2b.app'],async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}];}};
export default config;
