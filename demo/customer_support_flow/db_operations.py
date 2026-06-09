class TicketDatabase:
    def create(self, ticket_data: dict):
        print(f"Saving ticket to db: {ticket_data}")
        return {"ticket_id": 9988, "status": "saved"}
        
    def complete(self, ticket_id: int):
        print(f"Ticket {ticket_id} marked as resolved.")
        return True

db = TicketDatabase()

def save_support_ticket(ticket_info: dict):
    # The robust AST scanner MUST ignore this since it is a database call!
    result = db.create(ticket_info)
    db.complete(9988)
    return result
