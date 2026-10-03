const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sourceRoot = path.join(__dirname, '../src');
function compile(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(sourceRoot, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
  }).outputText;
}
const context = { exports: {}, URL, URLSearchParams };
vm.runInNewContext(compile('utils/googleMaps.ts'), context);
const maps = context.exports;
const uiContext = { exports: {}, React, require: name => name === 'react' ? React : maps };
vm.runInNewContext(compile('components/GoogleMap.tsx'), uiContext);
const { GoogleMapFrame } = uiContext.exports;

test('coordinates reject missing, nonfinite and out-of-range values', () => {
  for (const [lat, lng] of [[null,0],[undefined,10],[NaN,105],[91,105],[21,181],[0,0]]) assert.equal(maps.hasCoordinates(lat,lng),false);
  assert.equal(maps.hasCoordinates(0,105),true);
});
test('public iframe works without environment variables or API key', () => {
  const url=new URL(maps.googleMapEmbed(undefined,undefined,'12 Tràng Tiền, Hà Nội'));
  assert.equal(url.hostname,'maps.google.com');assert.equal(url.pathname,'/maps');
  assert.equal(url.searchParams.get('q'),'12 Tràng Tiền, Hà Nội');assert.equal(url.searchParams.get('output'),'embed');
  assert.equal(url.searchParams.has('key'),false);assert.equal(url.pathname.includes('/embed/v1'),false);
});
test('existing coordinates take priority; cleared coordinates use manual address', () => {
  assert.equal(new URL(maps.googleMapEmbed(21,105,'Hà Nội')).searchParams.get('q'),'21,105');
  assert.equal(new URL(maps.googleMapEmbed(0,0,'Đà Nẵng')).searchParams.get('q'),'Đà Nẵng');
  assert.equal(maps.googleMapEmbed(undefined,undefined,'  '),'');
});
test('query encoding preserves plus signs and rejects parameter injection', () => {
  const address='7P28+XX & key=wrong <script>';
  const url=new URL(maps.googleMapEmbed(undefined,undefined,address));
  assert.equal(url.searchParams.get('q'),address);assert.equal(url.searchParams.has('key'),false);
});
test('directions links use the Directions action with a destination and no key', () => {
  const url=new URL(maps.googleMapDirections(21,105));
  assert.equal(url.pathname,'/maps/dir/');assert.equal(url.searchParams.get('api'),'1');
  assert.equal(url.searchParams.get('destination'),'21,105');assert.equal(url.searchParams.has('origin'),false);assert.equal(url.searchParams.has('key'),false);
});
test('frame accepts only our public Google map URL shape', () => {
  for(const src of ['javascript:alert(1)','https://evil.example/maps?q=abc&output=embed','https://maps.google.com.evil.example/maps?q=abc&output=embed','https://maps.google.com/maps?q=abc']) assert.equal(maps.mapLinksFromEmbed(src),null);
  const links=maps.mapLinksFromEmbed(maps.googleMapEmbed(undefined,undefined,'Huế'));
  assert.equal(new URL(links.view).searchParams.get('query'),'Huế');
});
test('rendered map has fallback links, frame title and safe new-tab attributes', () => {
  const markup=renderToStaticMarkup(React.createElement(GoogleMapFrame,{src:maps.googleMapEmbed(21,105),title:'Vị trí khách sạn'}));
  assert.match(markup,/<iframe/);assert.match(markup,/Vị trí khách sạn/);assert.match(markup,/Mở Google Maps/);assert.match(markup,/Chỉ đường/);
  assert.match(markup,/noopener noreferrer/);assert.doesNotMatch(markup,/maps\/api\/js|embed\/v1|key=/);
  const empty=renderToStaticMarkup(React.createElement(GoogleMapFrame,{src:'',title:'Bản đồ'}));
  assert.match(empty,/Nhập địa chỉ/);assert.doesNotMatch(empty,/<iframe/);
});
test('provider pages have no paid lookups or SDK picker left', () => {
  for(const name of ['HotelProfileOriginalLayout','ProviderHotelFormPage','ProviderAttractionFormPage']){
    const text=fs.readFileSync(path.join(sourceRoot, 'pages/provider/'+name+'.tsx'),'utf8');
    assert.doesNotMatch(text,/mapApi|GoogleMapPicker|loadGoogleMaps|\.geocode\(|\.reverse\(/);
    assert.match(text,/GoogleMapAddressPreview/);
  }
});
