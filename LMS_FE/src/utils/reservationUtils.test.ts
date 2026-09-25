import { STATUS_CONFIG, fmtDate, isActiveCancellable, calcHoldDeadlineLabel } from './reservationUtils';

// ── STATUS_CONFIG ─────────────────────────────────────────────────────────────
describe('STATUS_CONFIG', () => {
  it('PENDING có nhãn "Đang chờ" và màu vàng', () => {
    expect(STATUS_CONFIG.PENDING.label).toBe('Đang chờ');
    expect(STATUS_CONFIG.PENDING.color).toContain('yellow');
  });

  it('READY_FOR_PICKUP có nhãn "Sẵn sàng nhận" và màu xanh', () => {
    expect(STATUS_CONFIG.READY_FOR_PICKUP.label).toBe('Sẵn sàng nhận');
    expect(STATUS_CONFIG.READY_FOR_PICKUP.color).toContain('green');
  });

  it('CANCELLED có nhãn "Đã hủy" và màu xám', () => {
    expect(STATUS_CONFIG.CANCELLED.label).toBe('Đã hủy');
    expect(STATUS_CONFIG.CANCELLED.color).toContain('gray');
  });

  it('COMPLETED có nhãn "Hoàn thành" và màu xanh dương', () => {
    expect(STATUS_CONFIG.COMPLETED.label).toBe('Hoàn thành');
    expect(STATUS_CONFIG.COMPLETED.color).toContain('blue');
  });

  it('EXPIRED có nhãn "Hết hạn" và màu đỏ', () => {
    expect(STATUS_CONFIG.EXPIRED.label).toBe('Hết hạn');
    expect(STATUS_CONFIG.EXPIRED.color).toContain('red');
  });
});

// ── fmtDate ───────────────────────────────────────────────────────────────────
describe('fmtDate', () => {
  it('trả về "—" khi input là null', () => {
    expect(fmtDate(null)).toBe('—');
  });

  it('trả về "—" khi input là chuỗi không hợp lệ', () => {
    expect(fmtDate('not-a-date')).toBe('—');
  });

  it('format ISO string thành dạng HH:mm dd/MM/yyyy', () => {
    const result = fmtDate('2026-05-10T07:30:00.000Z');
    expect(result).toMatch(/\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}/);
  });

  it('kết quả chứa năm 2026', () => {
    const result = fmtDate('2026-12-25T00:00:00.000Z');
    expect(result).toContain('2026');
  });
});

// ── isActiveCancellable ───────────────────────────────────────────────────────
describe('isActiveCancellable', () => {
  it('PENDING có thể hủy', () => {
    expect(isActiveCancellable('PENDING')).toBe(true);
  });

  it('READY_FOR_PICKUP có thể hủy', () => {
    expect(isActiveCancellable('READY_FOR_PICKUP')).toBe(true);
  });

  it('COMPLETED không thể hủy', () => {
    expect(isActiveCancellable('COMPLETED')).toBe(false);
  });

  it('CANCELLED không thể hủy', () => {
    expect(isActiveCancellable('CANCELLED')).toBe(false);
  });

  it('EXPIRED không thể hủy', () => {
    expect(isActiveCancellable('EXPIRED')).toBe(false);
  });
});

// ── calcHoldDeadlineLabel ─────────────────────────────────────────────────────
describe('calcHoldDeadlineLabel', () => {
  it('trả về chuỗi rỗng khi holdExpirationTime là null', () => {
    expect(calcHoldDeadlineLabel(null)).toBe('');
  });

  it('trả về "Đã hết hạn" khi thời gian đã qua', () => {
    const past = new Date(Date.now() - 3_600_000).toISOString(); // 1 giờ trước
    expect(calcHoldDeadlineLabel(past)).toBe('Đã hết hạn');
  });

  it('trả về "Còn X giờ" khi còn dưới 24 giờ', () => {
    const soon = new Date(Date.now() + 5 * 3_600_000).toISOString(); // 5 giờ nữa
    expect(calcHoldDeadlineLabel(soon)).toMatch(/^Còn \d+ giờ$/);
  });

  it('trả về "Còn X ngày" khi còn trên 24 giờ', () => {
    const future = new Date(Date.now() + 48 * 3_600_000).toISOString(); // 2 ngày nữa
    expect(calcHoldDeadlineLabel(future)).toMatch(/^Còn \d+ ngày$/);
  });
});
