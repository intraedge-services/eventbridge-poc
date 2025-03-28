import path from 'path';
import url from 'url';
import 'dotenv/config'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** @type {import('@eventcatalog/core/bin/eventcatalog.config').Config} */
export default {
  cId: 'a53515c7-ae6f-4978-ac44-c26af1263f1d',
  title: 'EventBridge POC',
  tagline: 'Event-driven architecture with AWS EventBridge',
  organizationName: 'OurLogix',
  homepageLink: 'https://intraedge-services.github.io/eventbridge-poc/',
  landingPage: '',
  editUrl: 'https://github.com/boyney123/eventcatalog-demo/edit/master',
  // By default set to false, add true to get urls ending in /
  trailingSlash: false,
  // Change to make the base url of the site different, by default https://{website}.com/docs,
  // changing to /company would be https://{website}.com/company/docs,
  base: '/eventbridge-poc/',
  // Customize the logo, add your logo to public/ folder
  logo: {
    alt: 'EventCatalog Logo',
    src: '/logo.png',
    text: 'OurLogix',
  },
  docs: {
    sidebar: {
      // Should the sub heading be rendered in the docs sidebar?
      showPageHeadings: true,
    },
  },
  generators: [
    [
      '@eventcatalog/generator-eventbridge',
      {
        licenseKey: process.env.EVENTCATALOG_LICENSE_KEY_EVENTBRIDGE,
        region: 'us-east-2',
        registryName: 'my-schema-registry',
        domain: { id: 'eventbridge', name: 'EventBridge Integration', version: '1.0.0' },
        services: [
          {
            id: 'Publisher Service',
            version: '1.0.0',
            sends: [{ source: 'custom.app' }],
          },
          {
            id: 'Consumer Service',
            version: '1.0.0',
            receives: [{ source: 'custom.app'}],
          }
        ]
      },
    ],
  ],
};
