import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { UploadProvider, useUpload } from '../../contexts/UploadContext';

const UploadProbe = () => {
  const { uploads, addUpload, updateUpload, removeUpload } = useUpload();
  const first = uploads[0];
  return (
    <div>
      <span data-testid="count">{uploads.length}</span>
      <span data-testid="status">{first?.status ?? 'none'}</span>
      <span data-testid="progress">{first?.progress ?? -1}</span>
      <button onClick={() => addUpload({ id: 'u1', label: 'PDF', fileName: 'book.pdf' })}>Add</button>
      <button onClick={() => updateUpload('u1', { progress: 60 })}>Progress</button>
      <button onClick={() => updateUpload('u1', { status: 'done', progress: 100 })}>Done</button>
      <button onClick={() => removeUpload('u1')}>Remove</button>
    </div>
  );
};

describe('UploadProvider', () => {
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  beforeEach(() => {
    addSpy = jest.spyOn(window, 'addEventListener');
    removeSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('adds uploads with uploading status and zero progress', () => {
    render(<UploadProvider><UploadProbe /></UploadProvider>);

    fireEvent.click(screen.getByText('Add'));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('status')).toHaveTextContent('uploading');
    expect(screen.getByTestId('progress')).toHaveTextContent('0');
  });

  it('updates progress and final status', () => {
    render(<UploadProvider><UploadProbe /></UploadProvider>);

    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Progress'));
    expect(screen.getByTestId('progress')).toHaveTextContent('60');

    fireEvent.click(screen.getByText('Done'));
    expect(screen.getByTestId('status')).toHaveTextContent('done');
    expect(screen.getByTestId('progress')).toHaveTextContent('100');
  });

  it('removes upload items', () => {
    render(<UploadProvider><UploadProbe /></UploadProvider>);

    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Remove'));

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('registers beforeunload while an upload is running', () => {
    render(<UploadProvider><UploadProbe /></UploadProvider>);

    fireEvent.click(screen.getByText('Add'));

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('removes beforeunload listener when upload state changes or unmounts', () => {
    const { unmount } = render(<UploadProvider><UploadProbe /></UploadProvider>);

    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Done'));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });
});
