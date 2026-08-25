from src.services.vector_store import vector_store_service

def test_semantic_search():
    queries = [
        "I need soundproof drywall for a recording music studio",
        "Waterproof walk in shower bathroom partition",
        "Fire rated wall 90 minutes EI 90",
        "Impact sound decoupling floor underlay",
    ]

    for q in queries:
        results = vector_store_service.similarity_search(query=q, limit=3)
        print(f"\nQUERY: {q}")
        for i, item in enumerate(results, 1):
            print(f"  {i}. [{item['entity_type'].upper()}] {item['code']} — {item['title']} (Score: {item['similarity_score']})")

if __name__ == "__main__":
    test_semantic_search()
