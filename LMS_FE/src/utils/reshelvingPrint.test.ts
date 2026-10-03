import { buildReshelvingPrintHtml } from '../../utils/reshelvingPrint';

test('A4 print slips include checkboxes and escape reader-supplied text', () => {
  const html = buildReshelvingPrintHtml([{
    taskId: '1', source: 'RESERVATION_EXPIRED', barcode: 'BC1', publicationTitle: '<script>alert(1)</script>',
    location: 'A1', branch: 'CS1', queuedAt: '2026-10-03T08:00:00Z', studentId: '0012345', fullName: 'Reader',
  }], 'vi');
  expect(html).toContain('size:A4 portrait');
  expect(html).toContain('class="box"');
  expect(html).toContain('0012345');
  expect(html).toContain('Hết hạn nhận đặt trước');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
});
