"""
Test script for distillation validation functionality
Tests the new PRD-compliant prompt and validation logic
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import (
    truncate_one_liner, 
    validate_and_fix_distilled_data,
    VALID_ENTITY_TYPES,
    VALID_RELATION_TYPES
)

def test_truncate_one_liner():
    """Test one-liner truncation"""
    print("🔍 Testing one-liner truncation...")
    
    # Test short text (should not truncate)
    short_text = "This is a short idea"
    result = truncate_one_liner(short_text, max_words=20)
    assert result == short_text, "Short text should not be truncated"
    print("✅ Short text preserved")
    
    # Test long text (should truncate)
    long_text = " ".join([f"word{i}" for i in range(30)])
    result = truncate_one_liner(long_text, max_words=20)
    assert len(result.split()) == 20, "Long text should be truncated to 20 words"
    print("✅ Long text truncated correctly")
    
    # Test exact boundary
    exact_text = " ".join([f"word{i}" for i in range(20)])
    result = truncate_one_liner(exact_text, max_words=20)
    assert result == exact_text, "Text with exactly 20 words should not be truncated"
    print("✅ Boundary case handled correctly")

def test_validate_entity_types():
    """Test entity type validation"""
    print("\n🔍 Testing entity type validation...")
    
    valid_data = {
        "one_liner": "Test idea",
        "tags": ["test"],
        "summary": "Test summary",
        "graph_structure": {
            "nodes": [
                {"id": "n1", "name": "Node 1", "type": "Concept", "desc": "A concept"},
                {"id": "n2", "name": "Node 2", "type": "Tool", "desc": "A tool"}
            ],
            "edges": []
        }
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(valid_data)
    assert is_valid, f"Valid entity types should pass: {errors}"
    print("✅ Valid entity types accepted")
    
    # Test invalid entity type
    invalid_data = {
        "one_liner": "Test idea",
        "tags": ["test"],
        "summary": "Test summary",
        "graph_structure": {
            "nodes": [
                {"id": "n1", "name": "Node 1", "type": "InvalidType", "desc": "Invalid"}
            ],
            "edges": []
        }
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(invalid_data)
    assert not is_valid, "Invalid entity type should be caught"
    assert fixed["graph_structure"]["nodes"][0]["type"] == "Concept", "Invalid type should default to Concept"
    print("✅ Invalid entity type caught and fixed")

def test_validate_relation_types():
    """Test relation type validation"""
    print("\n🔍 Testing relation type validation...")
    
    valid_data = {
        "one_liner": "Test idea",
        "tags": ["test"],
        "summary": "Test summary",
        "graph_structure": {
            "nodes": [
                {"id": "n1", "name": "Node 1", "type": "Problem", "desc": "A problem"},
                {"id": "n2", "name": "Node 2", "type": "Solution", "desc": "A solution"}
            ],
            "edges": [
                {"source": "n1", "target": "n2", "relation": "solves", "desc": "Solves the problem"}
            ]
        }
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(valid_data)
    assert is_valid, f"Valid relation types should pass: {errors}"
    print("✅ Valid relation types accepted")
    
    # Test invalid relation type
    invalid_data = {
        "one_liner": "Test idea",
        "tags": ["test"],
        "summary": "Test summary",
        "graph_structure": {
            "nodes": [
                {"id": "n1", "name": "Node 1", "type": "Concept", "desc": "A concept"},
                {"id": "n2", "name": "Node 2", "type": "Concept", "desc": "Another concept"}
            ],
            "edges": [
                {"source": "n1", "target": "n2", "relation": "invalid_relation"}
            ]
        }
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(invalid_data)
    assert not is_valid, "Invalid relation type should be caught"
    assert fixed["graph_structure"]["edges"][0]["relation"] == "relates_to", "Invalid relation should default to relates_to"
    print("✅ Invalid relation type caught and fixed")

def test_validate_schema_completeness():
    """Test complete schema validation"""
    print("\n🔍 Testing schema completeness...")
    
    # Test missing fields
    incomplete_data = {
        "one_liner": "Test idea"
        # Missing tags, summary, graph_structure
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(incomplete_data)
    assert not is_valid, "Incomplete data should be caught"
    assert "tags" in fixed, "Missing tags should be added"
    assert "summary" in fixed, "Missing summary should be added"
    assert "graph_structure" in fixed, "Missing graph_structure should be added"
    print("✅ Missing fields detected and fixed")
    
    # Test complete valid data
    complete_data = {
        "one_liner": "Complete test idea",
        "tags": ["tag1", "tag2"],
        "summary": "A complete summary",
        "graph_structure": {
            "nodes": [
                {"id": "n1", "name": "Node 1", "type": "Concept", "desc": "Description"}
            ],
            "edges": []
        }
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(complete_data)
    assert is_valid, f"Complete valid data should pass: {errors}"
    print("✅ Complete schema validated successfully")

def test_one_liner_auto_truncation():
    """Test automatic one-liner truncation in validation"""
    print("\n🔍 Testing automatic one-liner truncation...")
    
    long_one_liner = " ".join([f"word{i}" for i in range(30)])
    data = {
        "one_liner": long_one_liner,
        "tags": ["test"],
        "summary": "Test",
        "graph_structure": {"nodes": [], "edges": []}
    }
    
    is_valid, fixed, errors = validate_and_fix_distilled_data(data)
    assert len(fixed["one_liner"].split()) == 20, "One-liner should be auto-truncated to 20 words"
    print("✅ One-liner auto-truncated in validation")

def main():
    print("=" * 60)
    print("Distillation Validation Tests")
    print("=" * 60)
    
    try:
        test_truncate_one_liner()
        test_validate_entity_types()
        test_validate_relation_types()
        test_validate_schema_completeness()
        test_one_liner_auto_truncation()
        
        print("\n" + "=" * 60)
        print("✅ All validation tests passed!")
        print("=" * 60)
        
        print("\n📋 Validated features:")
        print(f"   • Entity types: {VALID_ENTITY_TYPES}")
        print(f"   • Relation types: {VALID_RELATION_TYPES}")
        print("   • One-liner 20-word limit with auto-truncation")
        print("   • Complete JSON schema validation")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
