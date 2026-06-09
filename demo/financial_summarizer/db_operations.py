class NewsDatabase:
    def create(self, record: dict):
        print(f"Db insert news record: {record}")
        return {"db_id": 456, "status": "stored"}
        
    def complete(self, transaction_id: str):
        print(f"Transaction {transaction_id} committed.")
        return True

db = NewsDatabase()

def save_financial_summary(summary_data: dict):
    # The robust AST scanner MUST ignore this since it is a database call!
    res = db.create(summary_data)
    db.complete("tx_4567")
    return res
