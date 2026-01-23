"""
Update Model
Represents a news article/update in the database
"""

from datetime import datetime
import json


class Update:
    """
    Represents a single update/article
    """
    
    def __init__(self, db):
        self.db = db
        
        class UpdateModel(db.Model):
            __tablename__ = 'updates'
            
            id = db.Column(db.Integer, primary_key=True)
            
            # Content
            title = db.Column(db.String(500), nullable=False)
            url = db.Column(db.String(1000), unique=True, nullable=False)
            summary = db.Column(db.Text)
            content = db.Column(db.Text)
            
            # Metadata
            date_published = db.Column(db.Date)
            date_scraped = db.Column(db.DateTime, default=datetime.utcnow)
            source_name = db.Column(db.String(200))
            source_url = db.Column(db.String(1000))
            
            # Classification
            category = db.Column(db.String(100))  # One of the 5 categories
            state_codes = db.Column(db.String(200))  # JSON array: ["TN", "MH"]
            tags = db.Column(db.String(500))  # JSON array: ["AI Policy", "Healthcare"]
            
            # AI Analysis
            is_ai_relevant = db.Column(db.Boolean, default=False)
            relevance_score = db.Column(db.Float)  # 0-100
            
            # Admin Control
            is_approved = db.Column(db.Boolean, default=False)
            admin_notes = db.Column(db.Text)
            
            def to_dict(self):
                """Convert to JSON-friendly dictionary"""
                return {
                    'id': self.id,
                    'title': self.title,
                    'url': self.url,
                    'summary': self.summary,
                    'date_published': self.date_published.isoformat() if self.date_published else None,
                    'date_scraped': self.date_scraped.isoformat() if self.date_scraped else None,
                    'source_name': self.source_name,
                    'category': self.category,
                    'state_codes': json.loads(self.state_codes) if self.state_codes else [],
                    'tags': json.loads(self.tags) if self.tags else [],
                    'is_ai_relevant': self.is_ai_relevant,
                    'relevance_score': self.relevance_score,
                    'is_approved': self.is_approved
                }
            
            def __repr__(self):
                return f'<Update {self.id}: {self.title[:50]}>'
        
        self.Model = UpdateModel
    
    @property
    def query(self):
        return self.Model.query
    
    def create(self, **kwargs):
        """Create new update"""
        update = self.Model(**kwargs)
        self.db.session.add(update)
        self.db.session.commit()
        return update
    
    def find_by_url(self, url):
        """Find update by URL (for duplicate detection)"""
        return self.Model.query.filter_by(url=url).first()
    
    def find_similar_titles(self, title, threshold=0.85):
        """Find updates with similar titles (for duplicate detection)"""
        from fuzzywuzzy import fuzz
        
        all_updates = self.Model.query.all()
        similar = []
        
        for update in all_updates:
            similarity = fuzz.ratio(title.lower(), update.title.lower()) / 100
            if similarity >= threshold:
                similar.append((update, similarity))
        
        return sorted(similar, key=lambda x: x[1], reverse=True)


# Factory function to create Update model
def create_update_model(db):
    return Update(db)
