import re

STOP_WORDS = {
    "the","and","for","with","a","an","to","of","in","on","at","by","from","is","are"
}

def clean_job_description(text):

    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)

    words = text.split()

    filtered_words = [
        w for w in words if w not in STOP_WORDS
    ]

    return " ".join(filtered_words)

def parse_job_description(job_description_text):
    """
    Main parser function used by the screening engine.

    Parameters:
    job_description_text (str)

    Returns:
    dict
    """

    cleaned_text = clean_job_description(job_description_text)

    jd_data = {
        "original_text": job_description_text,
        "cleaned_text": cleaned_text
    }

    # NOTE:
    # In the full system, this job description will come from:
    # - Frontend upload
    # - HR dashboard input
    # - API request

    return jd_data