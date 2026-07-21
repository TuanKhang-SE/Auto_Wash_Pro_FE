import axiosClient from "../api/axiosClient";

export interface BranchRatingStats {
  totalRating: number;
  totalReviews: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const reviewService = {
  async getBranchRatingStats(branchId: number): Promise<BranchRatingStats> {
    const response = await axiosClient.get(
      `/api/reviews/branch/${branchId}/rating-stats`,
      {
        headers: getAuthHeader(),
      }
    );
    if (response.data?.success) {
      return {
        totalRating: response.data.data?.totalRating ?? 0,
        totalReviews: response.data.data?.totalReviews ?? 0,
      };
    }
    return { totalRating: 0, totalReviews: 0 };
  },
};

export default reviewService;
