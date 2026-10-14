import assert from 'node:assert/strict';
import test from 'node:test';
import { formatEmailDate, renderJluxeEmail } from './email-templates';

test('formats ISO timestamps readably in UTC and omits invalid or missing dates', () => {
  assert.equal(formatEmailDate('2026-10-14T19:07:49.384Z'), '14 October 2026, 7:07 PM');
  assert.equal(formatEmailDate('not a date'), null);
  assert.equal(formatEmailDate(undefined), null);
});

test('renders the general enquiry fields in escaped HTML and plain text', () => {
  const rendered = renderJluxeEmail({
    title: 'New website enquiry', summary: 'Customer request', reference: 'ref-1',
    sections: [{ title: 'Enquiry details', fields: [
      { label: 'Interested service', value: 'Business Solutions' },
      { label: 'Message', value: '<script>alert("x")</script>\nनमस्ते' },
    ] }],
  });
  assert.match(rendered.html, /Business Solutions/);
  assert.match(rendered.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(rendered.html, /<script>/);
  assert.match(rendered.html, /नमस्ते/);
  assert.match(rendered.text, /<script>alert\("x"\)<\/script>\nनमस्ते/);
  assert.match(rendered.html, /#062F29/);
  assert.match(rendered.html, /#FAF9F6/);
  assert.match(rendered.html, /#C5A46D/);
});

test('renders buyer requirements without dropping submitted budget, location, or details', () => {
  const rendered = renderJluxeEmail({
    title: 'Buyer requirements enquiry', summary: 'Review requirements', reference: 'buyer-1',
    sections: [{ title: 'Property preferences', fields: [
      { label: 'Preferred city / location', value: 'Chennai' },
      { label: 'Minimum budget (INR)', value: '1000000' },
      { label: 'Maximum budget (INR)', value: '3000000' },
      { label: 'Bedrooms', value: '3' },
    ] }],
  });
  for (const value of ['Chennai', '1000000', '3000000', 'Bedrooms']) {
    assert.ok(rendered.html.includes(value));
    assert.ok(rendered.text.includes(value));
  }
});

test('omits empty property values and accepts only absolute HTTPS property images', () => {
  const withoutImage = renderJluxeEmail({
    title: 'Property enquiry', summary: 'Customer is interested',
    sections: [{ title: 'Property details', fields: [
      { label: 'Property', value: 'Harbour House' }, { label: 'Listed price', value: null },
      { label: 'Location', value: undefined },
    ] }],
    images: [{ url: '/relative.jpg', alt: 'Invalid image' }],
  });
  assert.match(withoutImage.html, /Harbour House/);
  assert.doesNotMatch(withoutImage.html, /Listed price|Location|relative\.jpg/);

  const withImage = renderJluxeEmail({
    title: 'Property enquiry', summary: 'Customer is interested', sections: [],
    images: [{ url: 'https://images.example/property.jpg', alt: 'Property exterior' }],
  });
  assert.match(withImage.html, /src="https:\/\/images\.example\/property\.jpg"/);
  assert.match(withImage.html, /alt="Property exterior"/);
});

test('renders a concise property link in HTML and a useful URL in plain text', () => {
  const rendered = renderJluxeEmail({
    title: 'Property enquiry', summary: 'Customer is interested', sections: [{
      title: 'Property details', fields: [{
        label: 'Public listing', value: 'View property listing',
        linkUrl: 'https://thejluxe.com/properties/harbour-house',
      }],
    }],
  });
  assert.match(rendered.html, /href="https:\/\/thejluxe\.com\/properties\/harbour-house"[^>]*>View property listing<\/a>/);
  assert.match(rendered.text, /View property listing \(https:\/\/thejluxe\.com\/properties\/harbour-house\)/);
});

test('keeps seller submission photo details and safe text output', () => {
  const rendered = renderJluxeEmail({
    title: 'Seller property submission', summary: 'Review the submission', reference: 'seller-1',
    sections: [
      { title: 'Submitted property', fields: [
        { label: 'Starting price', value: 'INR 45,00,000' },
        { label: 'Description', value: 'Corner plot\nOwner’s notes' },
      ] },
      { title: 'Submitted photos', fields: [{ label: 'Photo count', value: '1' }] },
    ],
    images: [{ url: 'https://images.example/seller.jpg', alt: 'Seller-submitted property photo 1' }],
  });
  assert.match(rendered.html, /Starting price/);
  assert.match(rendered.html, /Corner plot<br\/>Owner/);
  assert.match(rendered.text, /Owner’s notes/);
  assert.match(rendered.text, /Photo count: 1/);
});
