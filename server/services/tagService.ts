import { Tag } from '../models/Tag.ts';

export class TagService {
  async getAll() {
    return await Tag.find().sort({ name: 1 });
  }

  async getById(id: string) {
    return await Tag.findById(id);
  }

  async create(data: { name: string; description?: string }) {
    const tag = new Tag(data);
    return await tag.save();
  }

  async update(id: string, data: { name: string; description?: string }) {
    return await Tag.findByIdAndUpdate(
      id,
      { ...data, updated_at: new Date() },
      { new: true }
    );
  }

  async delete(id: string) {
    return await Tag.findByIdAndDelete(id);
  }

  async seedTags() {
    const defaultTags = [
      { name: 'Array', description: 'Problems involving array manipulation' },
      { name: 'String', description: 'Problems involving string manipulation' },
      { name: 'Hash Table', description: 'Problems involving hash tables' },
      { name: 'Dynamic Programming', description: 'Problems involving dynamic programming' },
      { name: 'Math', description: 'Problems involving mathematical concepts' },
      { name: 'Sorting', description: 'Problems involving sorting algorithms' },
      { name: 'Greedy', description: 'Problems involving greedy algorithms' },
      { name: 'Depth-First Search', description: 'Problems involving depth-first search' },
      { name: 'Binary Search', description: 'Problems involving binary search' },
      { name: 'Breadth-First Search', description: 'Problems involving breadth-first search' },
      { name: 'Tree', description: 'Problems involving tree data structures' },
      { name: 'Matrix', description: 'Problems involving matrix manipulation' },
      { name: 'Two Pointers', description: 'Problems involving two pointer technique' },
      { name: 'Bit Manipulation', description: 'Problems involving bit manipulation' },
      { name: 'Stack', description: 'Problems involving stack data structures' },
      { name: 'Heap (Priority Queue)', description: 'Problems involving heap data structures' },
      { name: 'Graph', description: 'Problems involving graph data structures' },
      { name: 'Prefix Sum', description: 'Problems involving prefix sum technique' },
      { name: 'Simulation', description: 'Problems involving simulation' },
      { name: 'Design', description: 'Problems involving system or data structure design' },
    ];

    for (const tagData of defaultTags) {
      const existing = await Tag.findOne({ name: tagData.name });
      if (!existing) {
        await new Tag(tagData).save();
      }
    }
  }
}

export const tagService = new TagService();
