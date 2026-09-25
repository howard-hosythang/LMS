import axiosInstance from './axiosInstance';

export interface SemanticSearchRequest {
  queryText: string;
  limit?: number;
}

export interface SemanticSearchResponse {
  code: number;
  message: string;
  data: {
    publicationIds: string[];
  };
}

const semanticSearchService = {
  search: async (
    request: SemanticSearchRequest
  ): Promise<SemanticSearchResponse> => {
    return axiosInstance.post('/ai/semantic-search', request);
  },
};

export default semanticSearchService;
