"""
State Model
Represents an Indian state
"""


def create_state_model(db):
    """Create State model"""
    
    class State(db.Model):
        __tablename__ = 'states'
        
        code = db.Column(db.String(10), primary_key=True)  # TN, MH, KA
        name = db.Column(db.String(100), nullable=False)
        config = db.Column(db.Text)  # JSON config
        
        def to_dict(self):
            return {
                'code': self.code,
                'name': self.name
            }
    
    return State
