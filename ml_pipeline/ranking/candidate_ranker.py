class CandidateRanker:
    """
    Converts raw ChromaDB search results into ranked candidate results.
    """

    def rank_candidates(self, chroma_results):

        ranked_candidates = []

        ids = chroma_results["ids"][0]
        metadatas = chroma_results["metadatas"][0]
        distances = chroma_results["distances"][0]

        for i in range(len(ids)):

            candidate_name = metadatas[i]["name"]

            # Convert distance to similarity score
            similarity_score = 1 / (1 + distances[i])

            ranked_candidates.append({
                "candidate_name": candidate_name,
                "similarity_score": round(similarity_score, 3)
            })

        # Sort by similarity score
        ranked_candidates = sorted(
            ranked_candidates,
            key=lambda x: x["similarity_score"],
            reverse=True
        )

        return ranked_candidates