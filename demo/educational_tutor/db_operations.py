class StudentDatabase:
    def create(self, student_record: dict):
        print(f"Db create student: {student_record}")
        return {"student_id": 789, "status": "enrolled"}
        
    def complete(self, transaction_id: str):
        print(f"Db transaction {transaction_id} marked as complete.")
        return True

db = StudentDatabase()

def save_student_profile(profile: dict):
    # The robust AST scanner MUST ignore this since it is a database call!
    res = db.create(profile)
    db.complete("tx_7890")
    return res
