import { getFriendlyErrorMessage } from '../../utils/errorMessages';

describe('getFriendlyErrorMessage', () => {
  it('maps duplicate email backend code to the English registration message', () => {
    const error = {
      status: 409,
      message: 'Email already exists',
      data: { code: 1103, message: 'Email already exists' },
    };

    expect(getFriendlyErrorMessage(error, 'en')).toBe('This email is already registered.');
  });

  it('maps duplicate email backend code to the Vietnamese registration message', () => {
    const error = {
      status: 409,
      message: 'Email đã được sử dụng',
      data: { code: 1103, message: 'Email đã được sử dụng' },
    };

    expect(getFriendlyErrorMessage(error, 'vi')).toBe('Email đã được sử dụng.');
  });

  it('does not confuse generic email already exists text with duplicate review', () => {
    const error = {
      status: 409,
      message: 'Email already exists',
    };

    expect(getFriendlyErrorMessage(error, 'en')).toBe('This email is already registered.');
  });

  it('keeps duplicate review mapped to the review-specific message', () => {
    const error = {
      status: 409,
      message: 'User already has a rating for this publication',
      data: { code: 2700 },
    };

    expect(getFriendlyErrorMessage(error, 'en')).toBe(
      'This loan transaction has already been reviewed.'
    );
  });

  it('maps duplicate ISBN backend code to a catalog-specific message', () => {
    const error = {
      status: 409,
      message: 'ISBN đã được sử dụng',
      data: { code: 2002 },
    };

    expect(getFriendlyErrorMessage(error, 'vi')).toBe('ISBN đã được sử dụng cho một ấn phẩm khác.');
  });
});
