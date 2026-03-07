from sentence_transformers import SentenceTransformer


class EmbeddingGenerator:
    """
    Generates embeddings for resumes and job descriptions.
    """

    def __init__(self):
        # Lightweight semantic embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def generate_embedding(self, text):
        """
        Generate embedding for a single text input.
        """

        if not text:
            return None

        embedding = self.model.encode(text)

        return embedding

    def generate_embeddings_batch(self, texts):
        """
        Generate embeddings for multiple texts.
        """

        embeddings = self.model.encode(texts)

        return embeddings