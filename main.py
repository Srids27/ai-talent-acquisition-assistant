"""
Main entry point for testing the Intelligent Screening Engine.

This script demonstrates how the screening pipeline works
by providing a sample job description and printing the
ranked candidates.
"""

from api_interface.screening_service import screen_candidates


def main():
    """
    Example execution of the screening pipeline.
    """

    # Example job description
    job_description = """
    Looking for a Python backend developer with experience in AWS,
    REST APIs, and cloud infrastructure.
    """

    print("\nRunning Intelligent Screening Engine...\n")

    results = screen_candidates(job_description)

    if not results:
        print("No candidates found.")
        return

    print("Top Candidates:\n")

    for i, candidate in enumerate(results):
        print(
            f"{i + 1}. {candidate['candidate_name']} "
            f"→ Match Score: {candidate['similarity_score']}"
        )


if __name__ == "__main__":
    main()