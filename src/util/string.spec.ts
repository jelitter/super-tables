import { isValidJson, isValidUrl } from './string';

describe('isValidUrl', () => {
  it('should return true for valid urls', () => {
    const validUrls = [
      'https://jsonplaceholder.typicode.com/albums',
      'https://jsonplaceholder.typicode.com/albums/1',
      'https://jsonplaceholder.typicode.com/albums/1/photos',
      'https://jsonplaceholder.typicode.com/albums/1/photos/1'
    ];
    validUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(true);
    });
  });

  it('should return false for invalid urls', () => {
    const invalidUrls = [
      'htt://jsonplaceholder.typicode.com/albums/1/photos/1/',
      'https//jsonplaceholder.typicode.com/albums/1/photos/1/2',
      'https:/jsonplaceholder.typicode.com/albums/1/photos/1/2/3'
    ];
    invalidUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(false);
    });
  });

  it('should return false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidUrl(null)).toBe(false);
  });
});

describe('isValidJson', () => {
  it('should return true for valid json', () => {
    const validJson = [
      '{"id":1,"title":"quidem molestiae enim"}',
      '{"id":1,"title":"quidem molestiae enim","url":"https://via.placeholder.com/600/92c952","thumbnailUrl":"https://via.placeholder.com/150/92c952"}',
      '{"id":1,"title":"quidem molestiae enim","url":"https://via.placeholder.com/600/92c952","thumbnailUrl":"https://via.placeholder.com/150/92c952","albumId":1}',
      '[{"id":1,"title":"quidem molestiae enim","url":"https://via.placeholder.com/600/92c952","thumbnailUrl":"https://via.placeholder.com/150/92c952","albumId":1}]'
    ];
    validJson.forEach(json => {
      expect(isValidJson(json)).toBe(true);
    });
  });

  it('should return false for invalid json', () => {
    const invalidJson = [
      '{"id":1,"title":"quidem molestiae enim",}',
      '{"id":1,"title"}',
      '{"id":1,"title":"quidem molestiae enim","url":"https://via.placeholder.com/600/92c952","thumbnailUrl":"https://via.placeholder.com/150/92c952","albumId":1,}'
    ];
    invalidJson.forEach(json => {
      expect(isValidJson(json)).toBe(false);
    });
  });

  it('should return false for empty string', () => {
    expect(isValidJson('')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidJson(null)).toBe(false);
  });
});
