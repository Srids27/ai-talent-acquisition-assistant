import pdfplumber
import os


def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a single PDF resume.

    Parameters:
    pdf_path (str): Path to the resume PDF

    Returns:
    str: Extracted text
    """

    text = ""

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"

    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")

    return text


def load_resumes_from_folder(folder_path):
    """
    Loads all resumes from a folder and extracts text.

    Parameters:
    folder_path (str): Folder containing resume PDFs

    Returns:
    list: List of dictionaries containing candidate resume text
    """

    resumes = []

    # Check if folder exists
    if not os.path.exists(folder_path):
        print(f"Resume folder not found: {folder_path}")
        return resumes

    files = os.listdir(folder_path)

    if len(files) == 0:
        print("Resume folder is empty.")
        return resumes

    for file in files:

        if file.endswith(".pdf"):

            path = os.path.join(folder_path, file)

            print(f"Processing resume: {file}")

            text = extract_text_from_pdf(path)

            resumes.append({
                "candidate_name": file.replace(".pdf", "").strip(),
                "resume_text": text
            })

    print(f"\nTotal resumes loaded: {len(resumes)}")

    # NOTE FOR FUTURE INTEGRATION:
    # In the full system, resumes may come from:
    # - Frontend uploads
    # - External resume databases
    # - Cloud storage
    # Currently we load resumes from a local folder for testing.

    return resumes